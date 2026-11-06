import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginCard() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        username: "",
        password: "",
    });

    function submit(e: { preventDefault: () => void }) {
        e.preventDefault();
        post("/login", {
            onFinish: () => reset("password"),
        });
    }

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Login to your account</CardTitle>
                <CardDescription>
                    Enter your username below to login to your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit}>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Enter your username"
                                value={data.username}
                                onChange={(e) =>
                                    setData("username", e.target.value)
                                }
                                autoFocus
                                autoComplete="username"
                                required
                            />
                            {errors.username && (
                                <p className="text-sm text-destructive">
                                    {errors.username}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                autoComplete="current-password"
                                required
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">
                                    {errors.password}
                                </p>
                            )}
                            <div className="flex items-center gap-2 pt-1">
                                <Checkbox
                                    id="show-password"
                                    checked={showPassword}
                                    onCheckedChange={(checked) =>
                                        setShowPassword(checked === true)
                                    }
                                />
                                <Label
                                    htmlFor="show-password"
                                    className="font-normal text-muted-foreground"
                                >
                                    Show password
                                </Label>
                            </div>
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button
                    type="submit"
                    className="w-full"
                    disabled={processing}
                    onClick={submit}
                >
                    {processing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in…
                        </>
                    ) : (
                        "Login"
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}