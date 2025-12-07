import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@renderer/components/ui/sidebar'
import { useFolder } from '@renderer/context/folder-context'
import { useUser } from '@renderer/context/user-context'
import { Bell, FolderOpen, Keyboard, Loader2, Palette, Shield, UserRound } from 'lucide-react'
import React, { useCallback, useState, useTransition } from 'react'

interface SettingsSection {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'account',
    title: 'Account',
    icon: UserRound
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell
  },
  {
    id: 'shortcuts',
    title: 'Shortcuts',
    icon: Keyboard
  },
  {
    id: 'security',
    title: 'Security',
    icon: Shield
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette
  }
]

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AccountSection: React.FC = () => {
  const { folderPath, setFolderPath, isValidating, isValid } = useFolder()
  const { user } = useUser()
  const [isPending, startTransition] = useTransition()

  const handleSelectFolder = useCallback((): void => {
    startTransition(async () => {
      if (!window.api) {
        return
      }

      try {
        const selectedPath = await window.api.selectFolder()
        if (selectedPath) {
          await setFolderPath(selectedPath)
        }
      } catch (error) {
        console.error('Error selecting folder:', error)
      }
    })
  }, [setFolderPath])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">User Information</h2>
        <p className="text-sm text-muted-foreground">Your account details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Your current account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Name</Label>
            <Input id="user-name" value={user?.name || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" value={user?.email || ''} disabled />
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-1">Course Folder</h2>
        <p className="text-sm text-muted-foreground">Select the folder containing your courses</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Folder Path</CardTitle>
          <CardDescription>Current course folder location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-path">Selected Folder</Label>
            <div className="flex items-center gap-2">
              <Input
                id="folder-path"
                value={folderPath || ''}
                placeholder="No folder selected"
                readOnly
                className={!isValid && folderPath ? 'border-destructive' : ''}
              />
              <Button onClick={handleSelectFolder} disabled={isPending || isValidating} size="icon">
                {isPending || isValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderOpen className="h-4 w-4" />
                )}
              </Button>
            </div>
            {!isValid && folderPath && (
              <p className="text-sm text-destructive">The selected folder is not accessible</p>
            )}
            {!folderPath && (
              <p className="text-sm text-muted-foreground">Please select a folder to continue</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const PlaceholderSection: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground">This section is coming soon</p>
      </CardContent>
    </Card>
  </div>
)

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  const [activeSection, setActiveSection] = useState<string>('account')

  const renderSectionContent = (): React.JSX.Element => {
    switch (activeSection) {
      case 'account':
        return <AccountSection />
      case 'notifications':
        return <PlaceholderSection title="Notifications" description="Manage your notification preferences" />
      case 'shortcuts':
        return <PlaceholderSection title="Keyboard Shortcuts" description="Customize keyboard shortcuts" />
      case 'security':
        return <PlaceholderSection title="Security" description="Manage security settings" />
      case 'appearance':
        return <PlaceholderSection title="Appearance" description="Customize the app appearance" />
      default:
        return <AccountSection />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[900px] max-w-[90vw] h-[85vh] p-0 gap-0 overflow-hidden">
        <div className="flex h-full">
          <SidebarContent className="border-r-sidebar-border bg-sidebar w-64 flex-none">
            <DialogHeader className="px-4 pt-4 pb-2">
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>Manage your application settings</DialogDescription>
            </DialogHeader>
            <SidebarGroup className="mt-4">
              <SidebarGroupContent>
                <SidebarMenu>
                  {SETTINGS_SECTIONS.map((section) => {
                    const Icon = section.icon
                    return (
                      <SidebarMenuItem key={section.id}>
                        <SidebarMenuButton
                          onClick={() => setActiveSection(section.id)}
                          isActive={activeSection === section.id}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{section.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <div className="flex-1 overflow-y-auto p-6">{renderSectionContent()}</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsDialog
