import { NetworkSegment } from "../types/NetworkSegment";

// If not using proxy, specify port 3001:
const API_BASE = "http://localhost:3001/api/network-segment";

// 1) Get list (with filters)
export async function fetchNetworkSegments(filters?: {
  vlan?: string;
  ipUsage?: string;
  searchTerm?: string;
}): Promise<NetworkSegment[]> {
  const params = new URLSearchParams();
  if (filters?.vlan) params.append("vlan", filters.vlan);
  if (filters?.ipUsage) params.append("ipUsage", filters.ipUsage);
  if (filters?.searchTerm) params.append("searchTerm", filters.searchTerm);

  const res = await fetch(`${API_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error("Error fetching network segments");
  return res.json();
}

// 2) Get details for a single IP
export async function fetchNetworkSegmentByIp(
  ip: string
): Promise<NetworkSegment> {
  const res = await fetch(`${API_BASE}/${ip}`);
  if (!res.ok) throw new Error("Error fetching detail by IP");
  return res.json();
}

// 3) PUT /update
export async function updateNetworkSegment(data: any) {
  const res = await fetch(`${API_BASE}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error updating record");
  return res.json();
}

// 4) GET DISTINCT VLAN
export async function fetchDistinctVlan(): Promise<{ value: any }[]> {
  const res = await fetch(`${API_BASE}/distinct/VLAN`);
  if (!res.ok) throw new Error("Error fetching distinct VLAN");
  return res.json();
}

// 5) Get list of allocated IPs by date
export async function fetchAllocatedIPsByDate(
  startDate: string,
  endDate: string
): Promise<NetworkSegment[]> {
  const params = new URLSearchParams();
  params.append("startDate", startDate);
  params.append("endDate", endDate);
  const res = await fetch(`${API_BASE}/allocated?${params.toString()}`);
  if (!res.ok) throw new Error("Error fetching allocated IPs by date");
  return res.json();
}

// 6) GET: Fetch network history from IP_History
export async function fetchNetworkHistory(filters?: {
  ip?: string;
  actionType?: string;
  startDate?: string;
  endDate?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.ip) params.append("ip", filters.ip);
  if (filters?.actionType) params.append("actionType", filters.actionType);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);

  const res = await fetch(`${API_BASE}/history?${params.toString()}`);
  if (!res.ok) throw new Error("Error fetching network history");
  return res.json();
}

// Delete IP information
export async function deleteNetworkSegment(ip: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(ip)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error deleting IP');
  return;
}
