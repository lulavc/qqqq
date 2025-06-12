'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string
  children: React.ReactNode
}

export function Tabs({ defaultValue, className, children, ...props }: TabsProps) {
  const [value, setValue] = React.useState(defaultValue)

  // Find all TabsTrigger and update their active state
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === TabsList) {
      return React.cloneElement(child, {
        value,
        onChange: setValue,
      })
    }
    return child
  })

  return (
    <div className={cn('w-full', className)} {...props}>
      {childrenWithProps}
    </div>
  )
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onChange?: (value: string) => void
  children: React.ReactNode
}

export function TabsList({ value, onChange, className, children, ...props }: TabsListProps) {
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === TabsTrigger) {
      return React.cloneElement(child, {
        isActive: value === child.props.value,
        onClick: () => onChange?.(child.props.value),
      })
    }
    return child
  })

  return (
    <div className={cn('flex space-x-1 bg-gray-100 p-1 rounded-lg', className)} {...props}>
      {childrenWithProps}
    </div>
  )
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  isActive?: boolean
  children: React.ReactNode
}

export function TabsTrigger({ value, isActive, className, children, ...props }: TabsTriggerProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-md transition-all',
        isActive 
          ? 'bg-white text-primary shadow-sm' 
          : 'text-gray-600 hover:text-gray-900',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const context = React.useContext(
    React.createContext<{ value: string }>({ value: '' })
  )
  
  if (value !== context.value) {
    return null
  }

  return (
    <div className={cn('mt-2', className)} {...props}>
      {children}
    </div>
  )
} 