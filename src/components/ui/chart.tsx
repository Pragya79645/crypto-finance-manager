import { Bar, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineController,
  BarController,
} from "chart.js"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineController,
  BarController,
)

interface BarChartProps {
  data: { name: string; value: number; target: number }[]
  index: string
  categories: string[]
  colors: string[]
  valueFormatter?: (value: number) => string
  className?: string
}

export function BarChart({ data, index, categories, colors, valueFormatter, className }: BarChartProps) {
  const chartData = {
    labels: data.map((item) => item.name),
    datasets: categories.map((category, i) => ({
      label: category,
      data: data.map((item) => item[category === "value" ? "value" : "target"]),
      backgroundColor: `var(--${colors[i]})`,
    })),
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
  }

  return <Bar data={chartData} options={options} className={className} />
}

interface LineChartProps {
  data: { date: string; amount: number }[]
  index: string
  categories: string[]
  colors: string[]
  valueFormatter?: (value: number) => string
  className?: string
}

export function LineChart({ data, index, categories, colors, valueFormatter, className }: LineChartProps) {
  const chartData = {
    labels: data.map((item) => item.date),
    datasets: categories.map((category, i) => ({
      label: category,
      data: data.map((item) => item.amount),
      borderColor: `var(--${colors[i]})`,
      backgroundColor: `var(--${colors[i]})`,
    })),
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
  }

  return <Line data={chartData} options={options} className={className} />
}
