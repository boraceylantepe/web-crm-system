import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { Card } from 'react-bootstrap';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
);

// Common chart options
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
    },
  },
};

// Line Chart Component
export const LineChart = ({ 
  data, 
  title = 'Line Chart', 
  height = 400, 
  options = {} 
}) => {
  const chartOptions = {
    ...defaultOptions,
    plugins: {
      ...defaultOptions.plugins,
      title: {
        ...defaultOptions.plugins.title,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    ...options,
  };

  return (
    <Card>
      <Card.Body>
        <div style={{ height: `${height}px` }}>
          <Line data={data} options={chartOptions} />
        </div>
      </Card.Body>
    </Card>
  );
};

// Bar Chart Component
export const BarChart = ({ 
  data, 
  title = 'Bar Chart', 
  height = 400, 
  options = {} 
}) => {
  const chartOptions = {
    ...defaultOptions,
    plugins: {
      ...defaultOptions.plugins,
      title: {
        ...defaultOptions.plugins.title,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    ...options,
  };

  return (
    <Card>
      <Card.Body>
        <div style={{ height: `${height}px` }}>
          <Bar data={data} options={chartOptions} />
        </div>
      </Card.Body>
    </Card>
  );
};

// Pie Chart Component
export const PieChart = ({ 
  data, 
  title = 'Pie Chart', 
  height = 400, 
  options = {} 
}) => {
  const chartOptions = {
    ...defaultOptions,
    plugins: {
      ...defaultOptions.plugins,
      title: {
        ...defaultOptions.plugins.title,
        text: title,
      },
    },
    ...options,
  };

  return (
    <Card>
      <Card.Body>
        <div style={{ height: `${height}px` }}>
          <Pie data={data} options={chartOptions} />
        </div>
      </Card.Body>
    </Card>
  );
};

// Doughnut Chart Component
export const DoughnutChart = ({ 
  data, 
  title = 'Doughnut Chart', 
  height = 400, 
  options = {} 
}) => {
  const chartOptions = {
    ...defaultOptions,
    plugins: {
      ...defaultOptions.plugins,
      title: {
        ...defaultOptions.plugins.title,
        text: title,
      },
    },
    ...options,
  };

  return (
    <Card>
      <Card.Body>
        <div style={{ height: `${height}px` }}>
          <Doughnut data={data} options={chartOptions} />
        </div>
      </Card.Body>
    </Card>
  );
};

// Metric Card Component
export const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'positive', 
  subtitle,
  icon 
}) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-success';
    if (changeType === 'negative') return 'text-danger';
    return 'text-muted';
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') return '↗';
    if (changeType === 'negative') return '↘';
    return '→';
  };

  return (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="card-title text-muted mb-2">{title}</h6>
            <h3 className="mb-0">{value}</h3>
            {subtitle && <small className="text-muted">{subtitle}</small>}
            {change !== undefined && (
              <div className={`small ${getChangeColor()} mt-1`}>
                {getChangeIcon()} {change}%
              </div>
            )}
          </div>
          {icon && (
            <div className="text-primary" style={{ fontSize: '2rem' }}>
              {icon}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

// Progress Bar Component
export const ProgressBarChart = ({ 
  title, 
  value, 
  max = 100, 
  color = 'primary',
  height = 'auto' 
}) => {
  const percentage = (value / max) * 100;

  return (
    <Card className="h-100">
      <Card.Body>
        <h6 className="card-title">{title}</h6>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span>{value}</span>
          <span className="text-muted">/{max}</span>
        </div>
        <div className="progress" style={{ height: '10px' }}>
          <div
            className={`progress-bar bg-${color}`}
            role="progressbar"
            style={{ width: `${percentage}%` }}
            aria-valuenow={value}
            aria-valuemin="0"
            aria-valuemax={max}
          />
        </div>
        <div className="text-center mt-2">
          <small className="text-muted">{percentage.toFixed(1)}%</small>
        </div>
      </Card.Body>
    </Card>
  );
};

// Data Table Component
export const DataTable = ({ 
  title, 
  data = [], 
  columns = [], 
  height = 400 
}) => {
  return (
    <Card>
      <Card.Header>
        <h6 className="mb-0">{title}</h6>
      </Card.Header>
      <Card.Body className="p-0">
        <div 
          style={{ 
            height: `${height}px`, 
            overflowY: 'auto' 
          }}
        >
          <table className="table table-striped table-hover mb-0">
            <thead className="bg-light sticky-top">
              <tr>
                {columns.map((column, index) => (
                  <th key={index} className="border-0">
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <td key={colIndex}>
                      {column.render 
                        ? column.render(row[column.key], row) 
                        : row[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card.Body>
    </Card>
  );
};

// Chart colors palette
export const chartColors = {
  primary: '#007bff',
  secondary: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  purple: '#6f42c1',
  pink: '#e83e8c',
  indigo: '#6610f2',
  teal: '#20c997',
  orange: '#fd7e14',
};

// Color palette for multiple series
export const colorPalette = [
  chartColors.primary,
  chartColors.success,
  chartColors.warning,
  chartColors.danger,
  chartColors.info,
  chartColors.purple,
  chartColors.pink,
  chartColors.teal,
  chartColors.orange,
  chartColors.indigo,
];

// Utility functions for chart data formatting
export const chartUtils = {
  // Format data for line/bar charts
  formatTimeSeriesData: (data, label = 'Value') => ({
    labels: data.map(item => {
      const date = new Date(item.period || item.date);
      return date.toLocaleDateString();
    }),
    datasets: [{
      label,
      data: data.map(item => item.count || item.value || 0),
      borderColor: chartColors.primary,
      backgroundColor: chartColors.primary + '20',
      tension: 0.1,
    }]
  }),

  // Format data for pie/doughnut charts
  formatPieData: (data, labelKey = 'label', valueKey = 'value') => ({
    labels: data.map(item => item[labelKey] || item.status || item.name),
    datasets: [{
      data: data.map(item => item[valueKey] || item.count || 0),
      backgroundColor: colorPalette.slice(0, data.length),
      borderWidth: 1,
    }]
  }),

  // Format multi-series data
  formatMultiSeriesData: (data, series) => ({
    labels: data.map(item => {
      const date = new Date(item.period || item.date);
      return date.toLocaleDateString();
    }),
    datasets: series.map((serie, index) => ({
      label: serie.label,
      data: data.map(item => item[serie.key] || 0),
      borderColor: colorPalette[index],
      backgroundColor: colorPalette[index] + '20',
      tension: 0.1,
    }))
  }),

  // Calculate percentage change
  calculateChange: (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  },

  // Format currency
  formatCurrency: (value, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  },

  // Format numbers with K/M suffixes
  formatLargeNumber: (value) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  },
}; 