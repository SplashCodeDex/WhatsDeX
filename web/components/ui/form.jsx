import * as React from "react"

import { useFormField } from "@/components/form" // This requires the full form system with react-hook-form

// Basic form field for now; full form with react-hook-form later

export const Form = ({ children, ...props }) => (
  <div {...props} />
)

export const FormLabel = ({ className, ...props }) => (
  <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />
)

export const FormControl = ({ className, ...props }) => (
  <div className={cn("flex flex-col w-full", className)} {...props} />
)

export const FormField = ({ form: _, ...props }) => {
  const { id, error, isValidating } = useFormField()
  return (
    <FormControl>
      <FormLabel htmlFor={id}>{props.label}</FormLabel>
      {props.children}
      {error && <p className="text-sm font-medium text-destructive">{error.message}</p>}
    </FormControl>
  )
}