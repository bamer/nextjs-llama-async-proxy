import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

// Professional Line Chart for time series data
export const TimeSeriesChart = ({
  data,
  dataKey = 'value',
  color = '#3182ce',
  height = 300,
  showGrid = true,
  showTooltip = true
}: {
  data: ChartData[];
  dataKey?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
      <XAxis
        dataKey="name"
        className="text-xs fill-muted-foreground"
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        className="text-xs fill-muted-foreground"
        axisLine={false}
        tickLine={false}
      />
      {showTooltip && (
         <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#f9fafb' }}
        />
      )}
      <Line
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        strokeWidth={2}
        dot={{ fill: color, strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
      />
    </LineChart>
  </ResponsiveContainer>
);

// Professional Area Chart for filled time series
export const AreaChartComponent = ({
  data,
  dataKey = 'value',
  color = '#3182ce',
  height = 300
}: {
  data: ChartData[];
  dataKey?: string;
  color?: string;
  height?: number;
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
      <XAxis
        dataKey="name"
        className="text-xs fill-muted-foreground"
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        className="text-xs fill-muted-foreground"
        axisLine={false}
        tickLine={false}
      />
      <Tooltip
        contentStyle={{
           backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '6px',
           color: '#f9fafb'
        }}
      />
      <Area
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        fill={color}
        fillOpacity={0.3}
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveContainer>
);

// Professional Bar Chart
export const BarChartComponent = ({
  data,
  dataKey = 'value',
  color = '#3182ce',
  height = 300
}: {
  data: ChartData[];
  dataKey?: string;
  color?: string;
  height?: number;
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
      <XAxis
        dataKey="name"
        className="text-xs fill-muted-foreground"
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        className="text-xs fill-muted-foreground"
        axisLine={false}
        tickLine={false}
      />
      <Tooltip
        contentStyle={{
           backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '6px',
           color: '#f9fafb'
        }}
      />
      <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

// Professional Pie Chart
export const PieChartComponent = ({
  data,
  dataKey = 'value',
  nameKey = 'name',
  colors = ['#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5'],
  height = 300
}: {
  data: ChartData[];
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  height?: number;
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
        outerRadius={80}
        fill="#8884d8"
        dataKey={dataKey}
        nameKey={nameKey}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
           backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '6px',
           color: '#f9fafb'
        }}
      />
    </PieChart>
  </ResponsiveContainer>
);

// Metric Card with mini chart
export const MetricCard = ({
  title,
  value,
  unit,
  icon,
  trend,
  chartData,
  color = '#3182ce'
}: {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  trend?: number;
  chartData?: ChartData[];
  color?: string;
}) => (
  <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-100">{title}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-100">{value}</span>
            <span className="text-sm text-gray-400">{unit}</span>
            {trend !== undefined && (
              <span className={`text-xs px-1 py-0.5 rounded ${
                trend > 0 ? 'bg-green-500 text-green-800' :
                trend < 0 ? 'bg-red-500 text-red-800' : trend > 0 ? 'bg-green-500 text-green-800' : 'bg-gray-500 text-gray-800'
              }`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
    {chartData && chartData.length > 0 && (
      <div className="h-16 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.2}
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);