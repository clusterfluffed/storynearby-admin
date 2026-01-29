import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'

interface SubscriptionBadgeProps {
  status: string
}

export default function SubscriptionBadge({ status }: SubscriptionBadgeProps) {
  const badges = {
    active: {
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      text: 'Active',
    },
    trialing: {
      color: 'bg-blue-100 text-blue-800',
      icon: Clock,
      text: 'Trial',
    },
    past_due: {
      color: 'bg-yellow-100 text-yellow-800',
      icon: AlertCircle,
      text: 'Payment Due',
    },
    canceled: {
      color: 'bg-gray-100 text-gray-800',
      icon: XCircle,
      text: 'Canceled',
    },
    inactive: {
      color: 'bg-red-100 text-red-800',
      icon: XCircle,
      text: 'Inactive',
    },
  }

  const badge = badges[status as keyof typeof badges] || badges.inactive
  const Icon = badge.icon

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
      <Icon className="h-4 w-4 mr-1.5" />
      {badge.text}
    </span>
  )
}
