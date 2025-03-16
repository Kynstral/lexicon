// noinspection ExceptionCaughtLocallyJS

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Member, MemberStatus } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MemberFormProps {
  member?: Member | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const MemberForm = ({ member, onSuccess, onCancel }: MemberFormProps) => {
  const [name, setName] = useState(member?.name || "");
  const [email, setEmail] = useState(member?.email || "");
  const [phone, setPhone] = useState(member?.phone || "");
  const [address, setAddress] = useState(member?.address || "");
  const [status, setStatus] = useState<MemberStatus>(
    member?.status || "Active",
  );
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const isEditing = !!member;

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };

    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (isEditing && member) {
        try {
          const { data, error } = await supabase
            .from("members")
            .select("*")
            .eq("id", member.id)
            .single();

          if (error) throw error;

          if (data) {
            setName(data.name || "");
            setEmail(data.email || "");
            setPhone(data.phone || "");
            setAddress(data.address || "");
            setStatus((data.status as MemberStatus) || "Active");
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unknown error occurred";

          toast({
            variant: "destructive",
            title: "Error loading member details",
            description: errorMessage,
          });
        } finally {
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    };
    fetchMemberDetails();
  }, [member, isEditing, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to perform this action.",
      });
      setLoading(false);
      return;
    }

    const memberData = {
      name,
      email,
      phone,
      address,
      status,
      user_id: userId,
    };

    try {
      if (isEditing && member) {
        const { error } = await supabase
          .from("members")
          .update(memberData)
          .eq("id", member.id);

        if (error) throw error;

        toast({
          title: "Member updated",
          description: `${name} has been updated successfully.`,
          className: "bg-green-50 border-green-200 text-green-800",
        });
      } else {
        const { error } = await supabase.from("members").insert([memberData]);

        if (error) throw error;

        toast({
          title: "Member added",
          description: `${name} has been added successfully.`,
          className: "bg-green-50 border-green-200 text-green-800",
        });
      }

      onSuccess();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      toast({
        variant: "destructive",
        title: isEditing ? "Failed to update member" : "Failed to add member",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (isInitializing && isEditing) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-pulse">Loading member details...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john.doe@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St, City, Country"
        />
      </div>

      {isEditing && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as MemberStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
              <SelectItem value="Banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? isEditing
              ? "Updating..."
              : "Adding..."
            : isEditing
              ? "Update Member"
              : "Add Member"}
        </Button>
      </div>
    </form>
  );
};

export default MemberForm;
