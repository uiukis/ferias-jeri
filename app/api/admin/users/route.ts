import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
    if (!url || !serviceKey) {
      return new Response(JSON.stringify({ error: "Service role não configurado" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const admin = createClient(url, serviceKey);
    const { data, error } = await admin
      .from("profiles")
      .select("id,name,email,role,created_at")
      .order("created_at", { ascending: false });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ items: data ?? [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email e senha são obrigatórios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
    if (!url || !serviceKey) {
      return new Response(JSON.stringify({ error: "Service role não configurado" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const admin = createClient(url, serviceKey);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role, must_change_password: true },
      email_confirm: true,
    });
    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const uid = created.user?.id as string | undefined;
    if (uid && (name || role)) {
      await admin.from("profiles").upsert({
        id: uid,
        name: name ?? null,
        role: role ?? "seller",
        email,
      });
    }

    return new Response(JSON.stringify({ id: uid }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body as { id?: string };
    if (!id) {
      return new Response(JSON.stringify({ error: "ID obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
    if (!url || !serviceKey) {
      return new Response(JSON.stringify({ error: "Service role não configurado" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const admin = createClient(url, serviceKey);
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
