import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { ChevronRight } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

const Dashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-6 w-full p-4 gap-4">
      <div className="grid grid-cols-2 col-span-4 gap-4">
        <Card className="col-span-2">card1</Card>
        <Card className="">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Tasks</CardTitle>
            <Link to="" className="text-sm text-primary flex items-center">
              More details
              <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>card2</CardContent>
        </Card>
        <Card className="">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Webinars</CardTitle>
            <Link to="" className="text-sm text-primary flex items-center">
              More details
              <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
        </Card>
      </div>
      <Card className="col-span-2">card4</Card>
    </div>
  )
}

export default Dashboard
