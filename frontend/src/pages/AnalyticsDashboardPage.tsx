import React, { useState, useEffect } from 'react';
import { AnalyticsData } from '../types';
import { api } from '../services/api';
import {
  DollarSign,
  Activity,
  AlertTriangle,
  Radio,
  Zap,
  RefreshCw,
  Navigation,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const AnalyticsDashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const typeChartData = (analytics?.typeMetrics || []).map((m) => ({
    name: m._id,
    'Avg Battery %': Math.round(m.avgBattery || 0),
    'Avg Fuel %': Math.round(m.avgFuel || 0),
    'Avg Odometer (k km)': Math.round((m.avgMileage || 0) / 1000),
  }));

  const revenueChartData = (analytics?.rentalRevenue || []).map((r) => ({
    name: r._id,
    'Total Revenue ($)': r.totalRevenue,
    'Total Distance (km)': r.totalDistanceKm,
  }));

  const totalRevenue = (analytics?.rentalRevenue || []).reduce(
    (sum, r) => sum + (r.totalRevenue || 0),
    0
  );
  const totalDistance = (analytics?.rentalRevenue || []).reduce(
    (sum, r) => sum + (r.totalDistanceKm || 0),
    0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '1.1rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              fontFamily: "'Outfit', 'Inter', sans-serif",
              letterSpacing: '-0.01em',
            }}
          >
            Big Data IoT Analytics
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', margin: '3px 0 0' }}>
            MongoDB Aggregation Pipelines & Real-time Geospatial IoT Telemetry Streams
          </p>
        </div>

        <button
          onClick={loadData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            background: '#141414',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Aggregations</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          {
            icon: DollarSign,
            label: 'Total Rental Volume',
            value: `$${totalRevenue.toLocaleString()}`,
            color: '#ffffff',
          },
          {
            icon: Navigation,
            label: 'Total Distance Tracked',
            value: `${totalDistance.toLocaleString()} km`,
            color: '#ffffff',
          },
          {
            icon: AlertTriangle,
            label: 'Active IoT Anomalies',
            value: analytics?.anomalies?.length || 4,
            color: '#f59e0b',
          },
          {
            icon: Zap,
            label: 'Fleet Energy Efficiency',
            value: '94.2%',
            color: '#22c55e',
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            style={{
              background: '#0a0a0a',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#141414',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color,
                flexShrink: 0,
              }}
            >
              <Icon size={19} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color,
                  fontFamily: "'Outfit', 'Inter', sans-serif",
                  marginTop: '2px',
                }}
              >
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Chart 1: Energy & Mileage by Category */}
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '14px',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Activity size={13} style={{ color: '#ffffff' }} />
            <span>MongoDB Pipeline: Fleet Energy & Odometer by Type</span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }} />
                <Bar dataKey="Avg Battery %" fill="#ffffff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Avg Fuel %" fill="#c9a84c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Avg Odometer (k km)" fill="#555555" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Revenue by Fleet Category */}
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '14px',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <DollarSign size={13} style={{ color: '#c9a84c' }} />
            <span>MongoDB Pipeline: Rental Revenue by Vehicle Segment</span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }} />
                <Bar dataKey="Total Revenue ($)" fill="#ffffff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Total Distance (km)" fill="#888888" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-time IoT Anomaly Event Stream */}
      <div
        style={{
          background: '#0a0a0a',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: '14px',
          padding: '1.25rem',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Radio size={13} style={{ color: '#f59e0b' }} />
          <span>Real-time IoT Geospatial Anomaly Stream</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(analytics?.anomalies || []).map((a) => (
            <div
              key={a._id}
              style={{
                padding: '12px 14px',
                background: '#111111',
                borderRadius: '9px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: a.harshBraking ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: a.harshBraking ? '#ef4444' : '#f59e0b',
                    fontWeight: 700,
                  }}
                >
                  {a.alertType || 'ANOMALY'}
                </span>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{a.vin}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', marginLeft: '8px' }}>
                    Speed: {a.speedKmH} km/h · Engine: {a.engineTempC}°C
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>
                GPS: [{a.location.coordinates[1].toFixed(4)}, {a.location.coordinates[0].toFixed(4)}] ·{' '}
                {new Date(a.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
