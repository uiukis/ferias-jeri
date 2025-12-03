import { supabase } from "@/lib/supabaseClient"

async function promote() {
  const { error } = await supabase.auth.updateUser({
    data: { role: "admin" },
  })
  if (error) throw error
  console.log("User promoted to admin via user metadata role")
}

promote().catch((e) => {
  console.error(e)
  process.exit(1)
})

