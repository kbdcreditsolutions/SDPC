"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function DashboardRevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid stroke="var(--sand)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => d.slice(5)}
          tick={{ fontSize: 11, fill: "var(--sage)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: "var(--sage)" }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => inr(Number(v))} />
        <Line type="monotone" dataKey="revenue" stroke="var(--forest)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DashboardBranchChart({ data }: { data: { name: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid stroke="var(--sand)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--sage)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--sage)" }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => inr(Number(v))} />
        <Bar dataKey="revenue" fill="var(--forest)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
