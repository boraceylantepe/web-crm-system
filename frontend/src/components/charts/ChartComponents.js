import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  useTheme,
  alpha,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart as RechartsAreaChart,
  Area
} from 'recharts';

// Enhanced Metric Card with trend indicators
export const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'primary',
  trend,
  trendValue,
  trendDirection,
  chart,
  background = false
}) => {
  const theme = useTheme();
  const TrendIcon = trendDirection === 'up' ? TrendingUpIcon : TrendingDownIcon;
  const trendColor = trendDirection === 'up' ? theme.palette.success.main : theme.palette.error.main;

  return (
    <Card 
      elevation={0}
      sx={{
        height: '100%',
        border: 1,
        borderColor: 'divider',
        background: background ? `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)` : 'background.paper',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                mb: 1
              }}
            >
              {title}
            </Typography>
            
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                mb: 1,
                color: color !== 'primary' ? `${color}.main` : 'text.primary'
              }}
            >
              {value}
            </Typography>

            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <TrendIcon sx={{ fontSize: 16, color: trendColor }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: trendColor, 
                    fontWeight: 'medium' 
                  }}
                >
                  {trendValue}
                </Typography>
              </Box>
            )}

            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>

          {icon && (
            <Box
              sx={{
                bgcolor: `${color}.light`,
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {React.cloneElement(icon, { 
                sx: { color: `${color}.main`, fontSize: 24 } 
              })}
            </Box>
          )}
        </Box>

        {chart && (
          <Box sx={{ mt: 2, height: 60 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chart}
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Enhanced Line Chart Component
export const LineChart = ({ 
  data, 
  title, 
  height = 300,
  showGrid = true,
  showLegend = true,
  colors = ['#1976d2', '#dc004e'],
  lines = [{ dataKey: 'value', name: 'Value' }]
}) => {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
      {title && (
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
          }
        />
      )}
      <Divider />
      <CardContent sx={{ p: 2 }}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsLineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
                boxShadow: theme.shadows[4]
              }}
            />
            {showLegend && <Legend />}
            {lines.map((line, index) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={line.name}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Enhanced Bar Chart Component
export const BarChart = ({ 
  data, 
  title, 
  height = 300,
  showGrid = true,
  showLegend = true,
  colors = ['#1976d2', '#dc004e'],
  bars = [{ dataKey: 'value', name: 'Value' }]
}) => {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
      {title && (
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
          }
        />
      )}
      <Divider />
      <CardContent sx={{ p: 2 }}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
                boxShadow: theme.shadows[4]
              }}
            />
            {showLegend && <Legend />}
            {bars.map((bar, index) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
                name={bar.name}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// New Donut Chart Component
export const DonutChart = ({ 
  data, 
  title, 
  height = 300,
  colors = ['#1976d2', '#dc004e', '#ed6c02', '#2e7d32', '#9c27b0'],
  showLegend = true,
  centerText,
  centerValue
}) => {
  const theme = useTheme();

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show labels for very small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
      {title && (
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
          }
        />
      )}
      <Divider />
      <CardContent sx={{ p: 2, position: 'relative' }}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
                boxShadow: theme.shadows[4]
              }}
            />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text overlay */}
        {(centerText || centerValue) && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}
          >
            {centerValue && (
              <Typography variant="h5" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                {centerValue}
              </Typography>
            )}
            {centerText && (
              <Typography variant="caption" color="text.secondary">
                {centerText}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// New Progress Chart Component
export const ProgressChart = ({ 
  title, 
  value, 
  total, 
  color = 'primary',
  height = 8,
  showPercentage = true,
  subtitle
}) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
          {showPercentage && (
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: `${color}.main` }}>
              {percentage.toFixed(1)}%
            </Typography>
          )}
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={percentage}
          color={color}
          sx={{
            height: height,
            borderRadius: height / 2,
            backgroundColor: alpha(color === 'primary' ? '#1976d2' : color, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: height / 2,
            }
          }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {value} of {total}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// New Area Chart Component
export const AreaChart = ({ 
  data, 
  title, 
  height = 300,
  color = '#1976d2',
  showGrid = true,
  gradient = true
}) => {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
      {title && (
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
          }
        />
      )}
      <Divider />
      <CardContent sx={{ p: 2 }}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsAreaChart data={data}>
            <defs>
              {gradient && (
                <linearGradient id={`color-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                </linearGradient>
              )}
            </defs>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
                boxShadow: theme.shadows[4]
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={gradient ? `url(#color-${color.replace('#', '')})` : color}
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// New Mini Chart Component for inline charts
export const MiniChart = ({ 
  data, 
  type = 'line',
  color = '#1976d2',
  height = 40,
  showTooltip = false
}) => {
  const ChartComponent = type === 'line' ? RechartsLineChart : RechartsBarChart;
  const DataComponent = type === 'line' ? Line : Bar;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={data}>
        {showTooltip && <Tooltip />}
        <DataComponent
          dataKey="value"
          stroke={color}
          fill={color}
          strokeWidth={2}
          dot={false}
          radius={type === 'bar' ? [2, 2, 0, 0] : undefined}
        />
      </ChartComponent>
    </ResponsiveContainer>
  );
};

// Legacy Chart.js components (keeping for backward compatibility)
export const LegacyLineChart = ({ data, options }) => {
  console.warn('LegacyLineChart is deprecated. Please use the new LineChart component.');
  return <LineChart data={data} {...options} />;
};

export const LegacyBarChart = ({ data, options }) => {
  console.warn('LegacyBarChart is deprecated. Please use the new BarChart component.');
  return <BarChart data={data} {...options} />;
};

// Export all components
export default {
  MetricCard,
  LineChart,
  BarChart,
  DonutChart,
  ProgressChart,
  AreaChart,
  MiniChart,
  // Legacy exports
  LegacyLineChart,
  LegacyBarChart
}; 