import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Table,
  Tag,
  Avatar,
  Space,
  Badge,
  Spin,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { User, Team } from '../../types';
import { teamsService, profilesService } from '../../services/supabaseService';
import { profileToUser, supabaseTeamToTeam } from '../../utils/typeAdapters';

const { Text, Title } = Typography;
const TEAL = '#00C4A1';

const Teams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [teamSearch, setTeamSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [teamsRes, profilesRes] = await Promise.all([
          teamsService.getAll(),
          profilesService.getAll(),
        ]);

        const fetchedUsers = profilesRes.data
          ? profilesRes.data.map((p) => profileToUser(p as any))
          : [];
        setAllUsers(fetchedUsers);

        if (teamsRes.data) {
          const fetchedTeams = teamsRes.data.map((t) => {
            const team = supabaseTeamToTeam(t);
            // Attach members by matching team_id on profiles
            const members = fetchedUsers.filter((u) => u.team_id === t.id);
            return { ...team, members, leader_id: t.created_by ?? undefined };
          });
          setTeams(fetchedTeams);
          if (fetchedTeams.length > 0) {
            setSelectedTeamId(fetchedTeams[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch teams data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTeams = useMemo(() => {
    if (!teamSearch) return teams;
    const lower = teamSearch.toLowerCase();
    return teams.filter((t) => t.name.toLowerCase().includes(lower));
  }, [teams, teamSearch]);

  const selectedTeam = useMemo(() => {
    return teams.find((t) => t.id === selectedTeamId);
  }, [teams, selectedTeamId]);

  const teamLeader = useMemo(() => {
    if (!selectedTeam?.leader_id) return null;
    return allUsers.find((u) => u.id === selectedTeam.leader_id) || null;
  }, [selectedTeam, allUsers]);

  const teamMembers = useMemo(() => {
    if (!selectedTeam?.members) return [];
    return selectedTeam.members;
  }, [selectedTeam]);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const memberColumns: ColumnsType<User> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <Avatar size={30} style={{ backgroundColor: TEAL }}>
            {getInitials(name)}
          </Avatar>
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100%' }}>
      <h2 style={{ margin: 0, marginBottom: 20, fontWeight: 600, fontSize: 22 }}>
        Teams Management
      </h2>

      <Row gutter={16}>
        {/* Left Column - Team List */}
        <Col span={8}>
          <Card
            title={
              <Space>
                <TeamOutlined />
                <span>Teams</span>
                <Badge
                  count={teams.length}
                  style={{ backgroundColor: TEAL }}
                />
              </Space>
            }
            style={{ borderRadius: 12, height: '100%' }}
            styles={{ body: { padding: 0 } }}
          >
            {/* Search */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <Input
                placeholder="Search teams..."
                prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                allowClear
              />
            </div>

            {/* Team items */}
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {filteredTeams.map((team) => {
                const isSelected = team.id === selectedTeamId;
                return (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    style={{
                      padding: '14px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f5f5f5',
                      backgroundColor: isSelected ? `${TEAL}10` : 'transparent',
                      borderLeft: isSelected ? `3px solid ${TEAL}` : '3px solid transparent',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#fafafa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text
                          strong={isSelected}
                          style={{
                            fontSize: 14,
                            color: isSelected ? TEAL : '#333',
                          }}
                        >
                          {team.name}
                        </Text>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                          {team.members?.length || 0} members
                        </div>
                      </div>
                      <Avatar.Group size={24} max={{ count: 3, style: { backgroundColor: TEAL, fontSize: 11 } }}>
                        {team.members?.map((member) => (
                          <Avatar
                            key={member.id}
                            size={24}
                            style={{ backgroundColor: TEAL }}
                          >
                            {member.name.charAt(0)}
                          </Avatar>
                        ))}
                      </Avatar.Group>
                    </div>
                  </div>
                );
              })}
              {filteredTeams.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  No teams found
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Right Column - Team Details */}
        <Col span={16}>
          <Card style={{ borderRadius: 12 }}>
            {selectedTeam ? (
              <>
                {/* Team Header */}
                <div style={{ marginBottom: 24 }}>
                  <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
                    {selectedTeam.name}
                  </Title>

                  {/* Team Leader */}
                  <Card
                    size="small"
                    style={{
                      borderRadius: 10,
                      background: `linear-gradient(135deg, ${TEAL}08, ${TEAL}15)`,
                      border: `1px solid ${TEAL}30`,
                      marginBottom: 16,
                    }}
                  >
                    <Space size={16} align="center">
                      <Avatar
                        size={56}
                        style={{
                          backgroundColor: TEAL,
                          fontSize: 22,
                          fontWeight: 600,
                        }}
                        icon={!teamLeader ? <UserOutlined /> : undefined}
                      >
                        {teamLeader ? getInitials(teamLeader.name) : null}
                      </Avatar>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CrownOutlined style={{ color: '#faad14', fontSize: 16 }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Team Leader
                          </Text>
                        </div>
                        <Text strong style={{ fontSize: 18 }}>
                          {teamLeader?.name || 'Not Assigned'}
                        </Text>
                        {teamLeader && (
                          <div style={{ fontSize: 13, color: '#666' }}>
                            {teamLeader.email}
                          </div>
                        )}
                      </div>
                    </Space>
                  </Card>

                  {/* Members Count */}
                  <Space>
                    <TeamOutlined style={{ color: TEAL }} />
                    <Text strong>Team Members</Text>
                    <Badge
                      count={teamMembers.length}
                      style={{ backgroundColor: TEAL }}
                    />
                  </Space>
                </div>

                {/* Members Table */}
                <Table<User>
                  columns={memberColumns}
                  dataSource={teamMembers}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                  scroll={{ x: 700 }}
                />
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                <TeamOutlined style={{ fontSize: 48, marginBottom: 16, color: '#ddd' }} />
                <div>Select a team to view details</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Teams;
