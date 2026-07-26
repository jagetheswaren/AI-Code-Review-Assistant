import React from 'react';
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
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const TrendChart = ({ data, type = 'line', title }) => {
  if (!data || data.length === 0) {
    return <div className="chart-empty">No trend data available</div>;
  }

  const labels = data.map(d => d._id || d.date);
  
  const lineData = {
    labels,
    datasets: [
      {
        label: 'Total Issues',
        data: data.map(d => d.total_issues || 0),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Security',
        data: data.map(d => d.security || 0),
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Code Smells',
        data: data.map(d => d.code_smell || 0),
        borderColor: '#d97706',
        backgroundColor: 'rgba(217, 119, 6, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Performance',
        data: data.map(d => d.performance || 0),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const severityData = {
    labels,
    datasets: [
      {
        label: 'Critical',
        data: data.map(d => d.critical || 0),
        backgroundColor: '#dc2626'
      },
      {
        label: 'High',
        data: data.map(d => d.high || 0),
        backgroundColor: '#ea580c'
      },
      {
        label: 'Medium',
        data: data.map(d => d.medium || 0),
        backgroundColor: '#d97706'
      },
      {
        label: 'Low',
        data: data.map(d => d.low || 0),
        backgroundColor: '#16a34a'
      },
      {
        label: 'Info',
        data: data.map(d => d.info || 0),
        backgroundColor: '#2563eb'
      }
    ]
  };

  const riskData = data[data.length - 1];
  const doughnutData = {
    labels: ['Security', 'Code Smells', 'Performance', 'Best Practice'],
    datasets: [{
      data: [
        riskData?.security || 0,
        riskData?.code_smell || 0,
        riskData?.performance || 0,
        riskData?.best_practice || 0
      ],
      backgroundColor: [
        '#dc2626',
        '#d97706',
        '#16a34a',
        '#2563eb'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: !!title,
        text: title,
        font: { size: 16 }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      x: { stacked: type === 'bar' },
      y: { 
        stacked: type === 'bar',
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      title: {
        display: !!title,
        text: title,
        font: { size: 16 }
      }
    }
  };

  if (type === 'doughnut') {
    return (
      <div className="chart-container">
        <Doughnut data={doughnutData} options={doughnutOptions} />
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className="chart-container">
        <Bar data={severityData} options={options} />
      </div>
    );
  }

  return (
    <div className="chart-container">
      <Line data={lineData} options={options} />
    </div>
  );
};

export default TrendChart;
