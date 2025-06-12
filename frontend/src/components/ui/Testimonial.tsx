import Image from 'next/image'
import { StarIcon } from '@heroicons/react/20/solid'

interface TestimonialProps {
  quote: string
  author: string
  role: string
  company: string
  stars?: number
  avatarUrl?: string
}

export function Testimonial({ 
  quote, 
  author, 
  role, 
  company, 
  stars = 5,
  avatarUrl 
}: TestimonialProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        {[...Array(5)].map((_, i) => (
          <StarIcon 
            key={i} 
            className={`w-5 h-5 ${i < stars ? 'text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
      
      <blockquote className="text-gray-700 mb-6 italic">
        "{quote}"
      </blockquote>
      
      <div className="flex items-center">
        {avatarUrl && (
          <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
            <Image
              src={avatarUrl}
              alt={author}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        <div>
          <p className="font-semibold text-gray-900">{author}</p>
          <p className="text-gray-600 text-sm">{role}, {company}</p>
        </div>
      </div>
    </div>
  )
} 