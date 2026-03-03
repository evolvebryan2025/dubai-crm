"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DUBAI_AREAS } from "@/lib/constants";
import { uploadContacts } from "@/app/(dashboard)/bulk-database/actions";
import { toast } from "sonner";
import { Upload, Loader2, FileSpreadsheet } from "lucide-react";

interface CsvRow {
  [key: string]: string;
}

export function CsvUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState({
    name: "",
    phone: "",
    unit_number: "",
    area: "",
  });
  const [areaTag, setAreaTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "map" | "done">("upload");
  const inputRef = useRef<HTMLInputElement>(null);

  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          result.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  }

  function parseCsv(text: string) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return { headers: [], rows: [] };

    const h = parseCsvLine(lines[0]);
    if (h.length === 0 || h.every((col) => !col)) return { headers: [], rows: [] };

    const r = lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const obj: CsvRow = {};
      h.forEach((header, i) => {
        obj[header] = values[i] || "";
      });
      return obj;
    });
    return { headers: h, rows: r };
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    if (f.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }

    const text = await f.text();
    const { headers: h, rows: r } = parseCsv(text);

    if (h.length === 0 || r.length === 0) {
      toast.error("Invalid CSV file. Please check the format and try again.");
      return;
    }

    setHeaders(h);
    setRows(r);

    // Auto-map common column names
    const autoMap = { name: "", phone: "", unit_number: "", area: "" };
    h.forEach((col) => {
      const lower = col.toLowerCase();
      if (lower.includes("name") && !autoMap.name) autoMap.name = col;
      if ((lower.includes("phone") || lower.includes("mobile") || lower.includes("number")) && !autoMap.phone)
        autoMap.phone = col;
      if (lower.includes("unit") && !autoMap.unit_number) autoMap.unit_number = col;
      if (lower.includes("area") || lower.includes("location")) autoMap.area = col;
    });
    setMapping(autoMap);
    setStep("map");
  }

  async function handleUpload() {
    if (!mapping.name) {
      toast.error("Name column mapping is required");
      return;
    }
    setLoading(true);

    const mapped = rows.map((row) => ({
      full_name: row[mapping.name] || "Unknown",
      phone: mapping.phone ? row[mapping.phone] || null : null,
      unit_number: mapping.unit_number ? row[mapping.unit_number] || null : null,
      area: mapping.area ? row[mapping.area] || null : null,
    }));

    const result = await uploadContacts(mapped, file?.name ?? "upload.csv", areaTag);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Uploaded ${result.count} contacts`);
      setStep("done");
    }
    setLoading(false);
  }

  if (step === "done") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <FileSpreadsheet className="h-12 w-12 text-green-500" />
          <p className="text-lg font-medium">Upload complete</p>
          <Button onClick={() => { setStep("upload"); setFile(null); setRows([]); setHeaders([]); }}>
            Upload Another
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "map") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Map Columns — {file?.name} ({rows.length} rows)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {(["name", "phone", "unit_number", "area"] as const).map((field) => (
              <div key={field} className="space-y-2">
                <Label>
                  {field === "name" ? "Name *" : field === "phone" ? "Phone Number" : field === "unit_number" ? "Unit Number" : "Area"}
                </Label>
                <Select
                  value={mapping[field]}
                  onValueChange={(val) => setMapping((m) => ({ ...m, [field]: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Skip —</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Area Tag (entire batch)</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={areaTag} onValueChange={setAreaTag}>
              <SelectTrigger>
                <SelectValue placeholder="Select area tag for this batch" />
              </SelectTrigger>
              <SelectContent>
                {DUBAI_AREAS.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {rows.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview (first 5 rows)</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="border-b p-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {headers.map((h) => (
                        <td key={h} className="border-b p-2">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setStep("upload"); setFile(null); }}>
            Back
          </Button>
          <Button onClick={handleUpload} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload {rows.length} Contacts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <Upload className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <p className="text-lg font-medium">Upload CSV File</p>
          <p className="text-sm text-muted-foreground">
            CSV with columns for name, phone, unit number, area
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button onClick={() => inputRef.current?.click()}>
          Select CSV File
        </Button>
      </CardContent>
    </Card>
  );
}
