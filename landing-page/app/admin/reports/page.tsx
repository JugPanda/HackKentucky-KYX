import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// This is a basic admin page - in production, add proper admin role checks
export default async function AdminReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // TODO: Add admin role check
  // For now, any authenticated user can access (update this in production!)

  // Fetch pending reports
  const { data: reports } = await supabase
    .from("reports")
    .select(`
      *,
      reporter:reporter_id (username),
      reported_user:reported_user_id (username),
      game:game_id (title, slug),
      comment:comment_id (content)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Moderation Dashboard</h1>
        <p className="text-muted-foreground">Review and manage reported content</p>
      </div>

      {reports && reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>
                      Report #{report.id.slice(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      Reported by {report.reporter?.username || "Unknown"} •{" "}
                      {new Date(report.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge>{report.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Target:</p>
                    <p className="text-sm text-muted-foreground">
                      {report.reported_user_id && `User: ${report.reported_user?.username}`}
                      {report.game_id && `Game: ${report.game?.title}`}
                      {report.comment_id && `Comment: ${report.comment?.content?.slice(0, 100)}...`}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Reason:</p>
                    <p className="text-sm">{report.reason}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="default">
                      Review
                    </Button>
                    <Button size="sm" variant="outline">
                      Dismiss
                    </Button>
                    <Button size="sm" variant="default">
                      Take Action
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No pending reports</p>
        </Card>
      )}
    </div>
  );
}

