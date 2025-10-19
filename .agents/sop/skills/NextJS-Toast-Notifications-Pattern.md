# NextJS-Toast-Notifications-Pattern

## Purpose
Implement shadcn/ui toast notifications in Next.js with proper state management using React hooks and Radix UI primitives.

## What This Teaches

- Creating toast hook with reducer pattern
- Toast state management without external libraries
- Integrating Radix UI primitives (ToastProvider, ToastViewport)
- Global toast system via layout provider
- TypeScript types for toast variants

## Key Dependencies

```json
{
  "@radix-ui/react-toast": "1.2.4"
}
```

## Core Implementation Pattern

### 1. Toast State Management Hook

Create `hooks/use-toast.ts`:

```typescript
"use client"

import * as React from "react"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

type ActionType = typeof actionTypes

type Action =
  | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
  | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> }
  | { type: ActionType["DISMISS_TOAST"]; toastId?: ToasterToast["id"] }
  | { type: ActionType["REMOVE_TOAST"]; toastId?: ToasterToast["id"] }

interface State {
  toasts: ToasterToast[]
}
```

### 2. Reducer Pattern

```typescript
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action
      
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      }
    }
    
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return { ...state, toasts: [] }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}
```

### 3. Global State Management

```typescript
const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

// Context-free toast function
function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return { id, dismiss, update }
}
```

### 4. React Hook

```typescript
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
```

### 5. Toast UI Components

Create `components/ui/toast.tsx`:

```typescript
"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { X } from "lucide-react"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className="group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all"
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className="text-sm font-semibold"
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className="text-sm opacity-90"
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
```

### 6. Toaster Component

Create `components/ui/toaster.tsx`:

```typescript
"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
```

### 7. Add to Layout

Update `app/layout.tsx`:

```typescript
import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

### 8. Usage in Components

```typescript
"use client"

import { useToast } from "@/hooks/use-toast"

export function MyComponent() {
  const { toast } = useToast()

  const handleClick = async () => {
    try {
      await someAsyncOperation()
      
      toast({
        title: "Success",
        description: "Operation completed successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      })
    }
  }

  return <button onClick={handleClick}>Do Something</button>
}
```

## Common Pitfalls

### 1. Missing Toaster in Layout
```typescript
// ❌ WRONG - Toast hook works but nothing renders
export default function RootLayout({ children }) {
  return <html><body>{children}</body></html>
}

// ✅ CORRECT - Toaster provides viewport
export default function RootLayout({ children }) {
  return (
    <html><body>
      {children}
      <Toaster />
    </body></html>
  )
}
```

### 2. Using Toast Outside Client Component
```typescript
// ❌ WRONG - Server component
export default function Page() {
  const { toast } = useToast()  // Error!
}

// ✅ CORRECT - Client component
"use client"
export default function Page() {
  const { toast } = useToast()  // Works!
}
```

### 3. Not Handling Async Errors
```typescript
// ❌ WRONG - No error handling
const handleClick = async () => {
  await fetch("/api/endpoint")
  toast({ title: "Success" })  // Never shows if fetch fails
}

// ✅ CORRECT - Try/catch with error toast
const handleClick = async () => {
  try {
    await fetch("/api/endpoint")
    toast({ title: "Success" })
  } catch (error) {
    toast({ title: "Error", variant: "destructive" })
  }
}
```

## Toast Variants

```typescript
// Success (default)
toast({
  title: "Success",
  description: "Operation completed.",
})

// Error (destructive)
toast({
  title: "Error",
  description: "Something went wrong.",
  variant: "destructive",
})

// With custom duration
toast({
  title: "Info",
  description: "This toast will auto-dismiss.",
  duration: 3000,
})
```

## Testing Strategy

1. **Render test**: Toast appears when triggered
2. **Dismiss test**: Toast disappears on close or timeout
3. **Multiple toasts**: TOAST_LIMIT enforced
4. **Variant test**: Different variants render correctly
5. **Async test**: Toast shows after async operation

## Complete Example

See:
- `frontend/hooks/use-toast.ts`
- `frontend/components/ui/toast.tsx`
- `frontend/components/ui/toaster.tsx`
- `frontend/app/layout.tsx`
- `frontend/app/feed/page.tsx` (usage example)

## References

- [Radix UI Toast](https://www.radix-ui.com/primitives/docs/components/toast)
- [shadcn/ui Toast](https://ui.shadcn.com/docs/components/toast)

