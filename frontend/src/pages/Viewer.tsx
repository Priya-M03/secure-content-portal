import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../services/api";

export default function Viewer() {
  const { id } = useParams();
  const [item, setItem] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/content").then(r => setItem(r.data.find((x: any) => x._id === id)))
      .catch(() => setError("Unable to load content."));
  }, [id]);

  if (error) return <Layout><div className="center">{error}</div></Layout>;
  if (!item) return <Layout><div className="center">Loading...</div></Layout>;

  return <Layout><section className="container">
    <div className="card viewer">
      <span className="tag">{item.type}</span>
      <h1>{item.title}</h1>
      <p>{item.description}</p>
      <div className="notice">
        Secure viewer endpoint is configured as a backend integration point.
        Configure private cloud storage and the protected `/api/content/:id/view`
        endpoint before production use.
      </div>
    </div>
  </section></Layout>;
}
