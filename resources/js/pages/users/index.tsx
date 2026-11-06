import Layout from "@/layouts/app-layout";
import type { ReactElement } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getColumns, type User } from "./columns";
import { UserFormDialog } from "./user-form-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { Plus } from "lucide-react";

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface UserPageProps {
    users: PaginatedUsers;
}

export default function UserPage({ users }: UserPageProps) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<User | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

    function openCreate() {
        setEditing(null);
        setOpen(true);
    }

    function openEdit(user: User) {
        setEditing(user);
        setOpen(true);
    }

    const columns = getColumns({
        onEdit: openEdit,
        onDeleteRequest: setDeleteTarget,
    });

    return (
        <div className="grid gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Users</h1>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Add User
                </Button>
            </div>

            <DataTable columns={columns} data={users.data} filterPlaceholder="Filter users..." />

            <UserFormDialog
                key={editing?.id ?? "new"}
                open={open}
                onOpenChange={setOpen}
                editing={editing}
            />

            <DeleteUserDialog
                target={deleteTarget}
                onOpenChange={(v: boolean) => {
                    if (!v) setDeleteTarget(null);
                }}
            />
        </div>
    );
}

UserPage.layout = (page: ReactElement) => <Layout>{page}</Layout>;