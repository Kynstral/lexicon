// noinspection ExceptionCaughtLocallyJS

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import MemberForm from "@/components/MemberForm";
import { Member } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

const EditMember = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("members")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setMember(data as Member);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";

        toast({
          title: "Error loading member",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-center">
          <p>Loading member details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Edit Member</h2>
      </div>

      <div className="border rounded-lg p-6 bg-card">
        <MemberForm
          member={member}
          onSuccess={() => {
            toast({
              description: "Member updated successfully",
              className: "text-green-600",
            });
            navigate("/members");
          }}
          onCancel={() => navigate("/members")}
        />
      </div>
    </div>
  );
};

export default EditMember;
