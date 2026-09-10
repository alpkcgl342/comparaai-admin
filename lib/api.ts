const API_URL = "http://localhost:3001";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getCategories() {
  const res = await fetch(`${API_URL}/categories`, { cache: "no-store" });
  return res.json();
}

export async function getProducts() {
  const res = await fetch(`${API_URL}/products`, { cache: "no-store" });
  return res.json();
}

export async function getProduct(id: string) {
  const res = await fetch(`${API_URL}/products/${id}`, { cache: "no-store" });
  return res.json();
}

export async function createProduct(data: any) {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateProduct(id: string, data: any) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteProduct(id: string) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
}

export async function createCategory(data: any) {
  const res = await fetch(`${API_URL}/categories`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error("Giriş başarısız");
  }
  return res.json();
}

export async function getArticles() {
  const res = await fetch(`${API_URL}/articles`, {
    cache: "no-store",
    headers: authHeaders(),
  });

  return res.json();
}

export async function getArticle(id: string) {
  const res = await fetch(`${API_URL}/articles/${id}`, {
    cache: "no-store",
    headers: authHeaders(),
  });

  return res.json();
}

export async function createArticle(data: {
  title: string;
  slug: string;
  summary?: string;
  content: string;
  imageUrl?: string;
  author?: string;
  status?: "draft" | "pending" | "published";
}) {
  const res = await fetch(`${API_URL}/articles`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || "Haber oluşturulamadı.");
  }

  return res.json();
}

export async function updateArticle(
  id: string,
  data: {
    title?: string;
    slug?: string;
    summary?: string;
    content?: string;
    imageUrl?: string;
    author?: string;
    status?: "draft" | "pending" | "published";
  },
) {
  const res = await fetch(`${API_URL}/articles/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || "Haber güncellenemedi.");
  }

  return res.json();
}

export async function deleteArticle(id: string) {
  const res = await fetch(`${API_URL}/articles/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  return res.json();
}

export async function uploadProductImage(file: File) {
  const token = getToken();

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/products/upload-image`, {
    method: "POST",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);

    throw new Error(
      data?.message || "Görsel yüklenemedi."
    );
  }

  return res.json();
}

export async function uploadArticleImage(file: File) {
  const token = getToken();

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/articles/upload-image`, {
    method: "POST",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);

    throw new Error(
      data?.message || "Görsel yüklenemedi."
    );
  }

  return res.json();
}