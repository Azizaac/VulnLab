import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const variants = cva("button", {
    variants: {
        variant: {
            default: "button-primary",
            outline: "button-outline",
            ghost: "button-ghost",
        },
        size: { default: "", sm: "button-sm" },
    },
    defaultVariants: { variant: "default", size: "default" },
});
type Props = ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof variants> & { asChild?: boolean };
export function Button({ asChild, variant, size, className, ...props }: Props) {
    const Component = asChild ? Slot : "button";
    return (
        <Component
            className={cn(variants({ variant, size }), className)}
            {...props}
        />
    );
}
