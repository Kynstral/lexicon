import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  Check,
  ExternalLink,
  MoreHorizontal,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Member, MemberStatus } from "@/lib/types";
import MemberForm from "@/components/MemberForm";
import MemberDetail from "@/components/MemberDetail";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useNavigate } from "react-router-dom";

const fetchMembers = async (userId: string | null): Promise<Member[]> => {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", userId)
    .order("name");

  if (error) {
    throw new Error(`Error fetching members: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return await Promise.all(
    data.map(async (member) => {
      const { count } = await supabase
        .from("borrowings")
        .select("*", { count: "exact", head: true })
        .eq("member_id", member.id)
        .eq("status", "Borrowed");

      return {
        ...member,
        status: validateMemberStatus(member.status),
        booksCheckedOut: count || 0,
      } as Member;
    }),
  );
};

const validateMemberStatus = (status: string): MemberStatus => {
  const validStatuses: MemberStatus[] = [
    "Active",
    "Inactive",
    "Suspended",
    "Banned",
  ];
  return validStatuses.includes(status as MemberStatus)
    ? (status as MemberStatus)
    : "Active";
};

const updateMemberStatus = async ({
  memberId,
  status,
  userId,
}: {
  memberId: string;
  status: MemberStatus;
  userId: string | null;
}) => {
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("members")
    .update({ status })
    .eq("id", memberId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating member status: ${error.message}`);
  }

  return data;
};

const deleteMember = async (memberId: string, userId: string | null) => {
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", memberId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Error deleting member: ${error.message}`);
  }

  return memberId;
};

const Members = () => {
  const { toast } = useToast();
  const { userId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MemberStatus | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "activate" | "deactivate" | "suspend" | "ban" | "delete" | null
  >(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const {
    data: members = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["members", userId],
    queryFn: () => fetchMembers(userId),
    enabled: !!userId,
  });

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      !searchQuery ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || member.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const updateStatusMutation = useMutation({
    mutationFn: (params: { memberId: string; status: MemberStatus }) =>
      updateMemberStatus({ ...params, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", userId] });
      toast({
        title: "Status updated",
        description: `Member status has been updated successfully.`,
      });
      setConfirmDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (memberId: string) => deleteMember(memberId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", userId] });
      toast({
        title: "Member deleted",
        description: `Member has been deleted successfully.`,
      });
      setConfirmDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedMember(null);
    queryClient.invalidateQueries({ queryKey: ["members", userId] });
  };

  const handleOpenForm = (member?: Member) => {
    setSelectedMember(member || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedMember(null);
  };

  const getActionConfig = () => {
    if (!confirmAction || !selectedMember)
      return { title: "", description: "", confirmLabel: "", icon: null };

    switch (confirmAction) {
      case "activate":
        return {
          title: "Activate Membership",
          description: `Are you sure you want to activate ${selectedMember.name}'s membership? This will grant them full library access.`,
          confirmLabel: "Activate",
          icon: <Check className="h-6 w-6 text-green-500" />,
        };
      case "deactivate":
        return {
          title: "Deactivate Membership",
          description: `Are you sure you want to deactivate ${selectedMember.name}'s membership? They will not be able to check out books until reactivated.`,
          confirmLabel: "Deactivate",
          icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
        };
      case "suspend":
        return {
          title: "Suspend Membership",
          description: `Are you sure you want to suspend ${selectedMember.name}'s membership? This is a temporary measure that can be reversed.`,
          confirmLabel: "Suspend",
          icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
        };
      case "ban":
        return {
          title: "Ban Member",
          description: `Are you sure you want to ban ${selectedMember.name}? This is a serious action for policy violations.`,
          confirmLabel: "Ban",
          icon: <Ban className="h-6 w-6 text-red-500" />,
        };
      case "delete":
        return {
          title: "Delete Member",
          description: `Are you sure you want to permanently delete ${selectedMember.name}'s record? This action cannot be undone.`,
          confirmLabel: "Delete",
          icon: <Trash2 className="h-6 w-6 text-red-500" />,
        };
      default:
        return { title: "", description: "", confirmLabel: "", icon: null };
    }
  };

  const getStatusColor = (status: MemberStatus) => {
    switch (status) {
      case "Active":
        return "bg-emerald-100 text-emerald-800";
      case "Inactive":
        return "bg-zinc-100 text-zinc-800";
      case "Suspended":
        return "bg-amber-100 text-amber-800";
      case "Banned":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleViewDetails = (member: Member) => {
    setSelectedMemberId(member.id);
    setIsDetailOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedMember || !confirmAction) return;

    switch (confirmAction) {
      case "activate":
        updateStatusMutation.mutate({
          memberId: selectedMember.id,
          status: "Active",
        });
        break;
      case "deactivate":
        updateStatusMutation.mutate({
          memberId: selectedMember.id,
          status: "Inactive",
        });
        break;
      case "suspend":
        updateStatusMutation.mutate({
          memberId: selectedMember.id,
          status: "Suspended",
        });
        break;
      case "ban":
        updateStatusMutation.mutate({
          memberId: selectedMember.id,
          status: "Banned",
        });
        break;
      case "delete":
        deleteMemberMutation.mutate(selectedMember.id);
        break;
    }
  };

  const actionConfig = getActionConfig();

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p>Please sign in to view your members.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-primary/70" />
          <p>Loading members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-destructive">
          <p>Error loading members. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            Members
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage library members and their borrowing activity
          </p>
        </div>

        <Button onClick={() => handleOpenForm()}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "Active" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("Active")}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === "Inactive" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("Inactive")}
          >
            Inactive
          </Button>
          <Button
            variant={statusFilter === "Suspended" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("Suspended")}
          >
            Suspended
          </Button>
          <Button
            variant={statusFilter === "Banned" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("Banned")}
          >
            Banned
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <Card key={member.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center p-6 gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Joined</p>
                      <p>{new Date(member.joined_date).toLocaleDateString()}</p>
                    </div>

                    <div className="text-sm">
                      <p className="text-muted-foreground">Books</p>
                      <p>{member.booksCheckedOut}</p>
                    </div>

                    <Badge className={getStatusColor(member.status)}>
                      {member.status}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(member)}
                      className="sm:ml-2"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/members/edit/${member.id}`)}
                        >
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {member.status !== "Active" && (
                          <DropdownMenuItem
                            className="text-green-600"
                            onClick={() => {
                              setSelectedMember(member);
                              setConfirmAction("activate");
                              setConfirmDialogOpen(true);
                            }}
                          >
                            Activate
                          </DropdownMenuItem>
                        )}
                        {member.status === "Active" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMember(member);
                              setConfirmAction("deactivate");
                              setConfirmDialogOpen(true);
                            }}
                          >
                            Deactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-amber-600"
                          onClick={() => {
                            setSelectedMember(member);
                            setConfirmAction("suspend");
                            setConfirmDialogOpen(true);
                          }}
                        >
                          Suspend
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedMember(member);
                            setConfirmAction("ban");
                            setConfirmDialogOpen(true);
                          }}
                        >
                          Ban
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-700"
                          onClick={() => {
                            setSelectedMember(member);
                            setConfirmAction("delete");
                            setConfirmDialogOpen(true);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No members found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery || statusFilter
                ? "Try adjusting your search criteria"
                : "Start by adding your first member"}
            </p>
            {!searchQuery && !statusFilter && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => handleOpenForm()}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              {actionConfig.icon}
              <DialogTitle>{actionConfig.title}</DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription>{actionConfig.description}</DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={
                confirmAction === "delete" || confirmAction === "ban"
                  ? "destructive"
                  : "default"
              }
              onClick={handleConfirmAction}
              disabled={
                updateStatusMutation.isPending || deleteMemberMutation.isPending
              }
            >
              {updateStatusMutation.isPending || deleteMemberMutation.isPending
                ? "Processing..."
                : actionConfig.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isDesktop ? (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedMember ? "Edit Member" : "Add New Member"}
              </DialogTitle>
            </DialogHeader>
            <MemberForm
              member={selectedMember}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseForm}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>
                {selectedMember ? "Edit Member" : "Add New Member"}
              </DrawerTitle>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={handleCloseForm}
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerHeader>
            <div className="px-4 pb-8">
              <MemberForm
                member={selectedMember}
                onSuccess={handleFormSuccess}
                onCancel={handleCloseForm}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {isDesktop ? (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Member Details</DialogTitle>
            </DialogHeader>
            {selectedMemberId && (
              <MemberDetail
                memberId={selectedMemberId}
                onClose={() => setIsDetailOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>Member Details</DrawerTitle>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setIsDetailOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerHeader>
            <div className="px-4 pb-8 overflow-y-auto">
              {selectedMemberId && (
                <MemberDetail
                  memberId={selectedMemberId}
                  onClose={() => setIsDetailOpen(false)}
                />
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};

export default Members;
