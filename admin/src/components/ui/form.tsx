import * as React from "react"
import { useFormField } from "./form"
import { Label } from "./label"

const FormFieldContext = React.createContext<FormFieldContextValue>({})

interface FormFieldContextValue {
  name?: string
}

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  name?: string
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, children, name, ...props }, ref) => {
    const context = React.useContext(FormFieldContext)
    const fullName = context.name ? `${context.name}-${name}` : name

    return (
      <FormFieldContext.Provider value={{ name: fullName }}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </FormFieldContext.Provider>
    )
  }
)
FormField.displayName = "FormField"

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2", className)} {...props} />
  )
)
FormItem.displayName = "FormItem"

interface FormLabelProps extends React.ComponentProps<typeof Label> {
  children?: React.ReactNode
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, children, ...props }, ref) => {
    const { error, formItemId } = useFormField()

    return (
      <Label
        ref={ref}
        className={cn(error && "text-destructive", className)}
        htmlFor={formItemId}
        {...props}
      >
        {children}
      </Label>
    )
  }
)
FormLabel.displayName = "FormLabel"

interface FormControlProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

const FormControl = React.forwardRef<
  HTMLDivElement,
  FormControlProps
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId } =
    useFormField()

  return (
    <div
      ref={ref}
      className="space-y-1"
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

interface FormDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode
}

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  FormDescriptionProps
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

interface FormMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode
}

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  FormMessageProps
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState } = itemContext

  const fieldState = getFieldState(fieldContext.name)

  const error = fieldState.error

  return {
    name: fieldContext.name,
    formItemId: itemContext.formItemId,
    formDescriptionId: itemContext.formDescriptionId,
    formMessageId: itemContext.formMessageId,
    error,
  }
}

type FormFieldContextValue = {
  name?: string
}

export {
  useFormField,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormFieldContext
}