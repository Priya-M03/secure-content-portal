import React from "react";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import type { Content } from "../types";

export default function Admin() {
  const [items, setItems] = useState<Content[]>([]);
  const [message, setMessage] = useState("");

  async function load() { setItems((await api.get("/content")).data); }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm("Are you sure you want to permanently delete this content?")) return;
    await api.delete(`/content/${id}`);
    setMessage("Content deleted.");
    load();
  }

  return <Layout><section className="container">
    <div className="page-head">
      <div><h1>Admin Dashboard</h1><p>Manage training and reference content.</p></div>
      <a className="btn" href="/admin/new">+ Upload Content</a>
    </div>
    {message && <div className="notice">{message}</div>}
    <div className="table-wrap card">
      <table><thead><tr><th>Title</th><th>Type</th><th>Category</th><th>Actions</th></tr></thead>
      <tbody>{items.map(i => <tr key={i._id}>
        <td>{i.title}</td><td>{i.type}</td><td>{i.category}</td>
        <td><button onClick={() => remove(i._id)} className="danger">Delete</button></td>
      </tr>)}</tbody></table>
    </div>
  </section></Layout>;
}
