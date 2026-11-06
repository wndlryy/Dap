import { useForm } from "@inertiajs/react";
import { type FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { User } from "./columns";

type Role = User["role"];

interface FormData {
    name: string;
    username: string;
    role: Role | "";
    password: string;
    password_confirmation: string;
}

interface UserFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: User | null;
}

const roleOptions: { value: Role; label: string }[] = [
    { value: "admin", label: "Admin" },
    { value: "user", label: "User" },
    { value: "waiter", label: "Waiter" },
    { value: "cashier", label: "Cashier" },
    { value: "kitchen-staff", label: "Kitchen Staff" },
];

export function UserFormDialog({ open, onOpenChange, editing }: UserFormDialogProps) {
    const isEdit = !!editing;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className="sm:max-w-md"
            >
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit User" : "Add User"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update this user's details. Leave password blank to keep it unchanged."
                            : "Create a new user account."}
                    </DialogDescription>
                </DialogHeader>
                {/* Unmounts when closed, so form state resets on every open */}
                {open && (
                    <UserForm editing={editing} onDone={() => onOpenChange(false)} />
                )}
            </DialogContent>
        </Dialog>
    );
}

function UserForm({ editing, onDone }: { editing: User | null; onDone: () => void }) {
    const isEdit = !!editing;

    const form = useForm<FormData>({
        name: editing?.name ?? "",
        username: editing?.username ?? "",
        role: editing?.role ?? "",
        password: "",
        password_confirmation: "",
    });

    const [initial] = useState(() => ({
        name: editing?.name ?? "",
        username: editing?.username ?? "",
        role: editing?.role ?? "",
    }));

    const errors = form.errors as Record<string, string | undefined>;

    const isDirty =
        !isEdit ||
        form.data.name !== initial.name ||
        form.data.username !== initial.username ||
        form.data.role !== initial.role ||
        form.data.password !== "";

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (editing) {
            form.transform((data) =>
                data.password
                    ? data
                    : { name: data.name, username: data.username, role: data.role }
            );
            form.put(`/users/${editing.id}`, {
                preserveScroll: true,
                onSuccess: onDone,
            });
            return;
        }

        form.post("/users", {
            preserveScroll: true,
            onSuccess: onDone,
        });
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
            <div className="grid gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    value={form.data.name}
                    aria-invalid={!!errors.name}
                    onChange={(e) => form.setData("name", e.target.value)}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="grid gap-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    value={form.data.username}
                    aria-invalid={!!errors.username}
                    onChange={(e) => form.setData("username", e.target.value)}
                />
                {errors.username && (
                    <p className="text-xs text-destructive">{errors.username}</p>
                )}
            </div>

            <div className="grid gap-1.5">
                <Label htmlFor="role">Role</Label>
                <Select
                    value={form.data.role}
                    onValueChange={(value) => form.setData("role", value as Role)}
                >
                    <SelectTrigger id="role" aria-invalid={!!errors.role}>
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        {roleOptions.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                                {r.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
            </div>

            <div className="grid gap-1.5">
                <Label htmlFor="password">
                    Password {isEdit && <span className="text-muted-foreground">(optional)</span>}
                </Label>
                <Input
                    id="password"
                    type="password"
                    value={form.data.password}
                    aria-invalid={!!errors.password}
                    onChange={(e) => form.setData("password", e.target.value)}
                    placeholder={isEdit ? "Leave blank to keep current password" : undefined}
                />
                {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                )}
            </div>

            <div className="grid gap-1.5">
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <Input
                    id="password_confirmation"
                    type="password"
                    value={form.data.password_confirmation}
                    onChange={(e) => form.setData("password_confirmation", e.target.value)}
                />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onDone}>
                    Cancel
                </Button>
                <Button type="submit" disabled={form.processing || !isDirty}>
                    {form.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isEdit
                        ? form.processing
                            ? "Saving..."
                            : "Save Changes"
                        : form.processing
                          ? "Adding..."
                          : "Add User"}
                </Button>
            </DialogFooter>
        </form>
    );
}