import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogContent } from '@renderer/components/ui/dialog'
import { Label } from '@renderer/components/ui/label'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@renderer/components/ui/sidebar'
import { useFolder } from '@renderer/context/folder-context'
import { Bell, Keyboard, Palette, Shield, UserRound } from 'lucide-react'
import React, { useState, useTransition } from 'react'

const settingsItems = [
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

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  const [activeSection, setActiveSection] = useState('account')
  const { setFolderPath, folderPath } = useFolder()
  const [isPending, startTransition] = useTransition()

  const handleSelectFolder = (): void => {
    startTransition(async () => {
      try {
        if (!window.api) {
          return
        }

        const selectedPath = await window.api.selectFolder()
        if (selectedPath) {
          await setFolderPath(selectedPath)

          try {
            const userIdStr = localStorage.getItem('currentUserId')
            const userId = userIdStr ? parseInt(userIdStr, 10) : null
            if (userId) {
              await window.api.setUserCourseFolder(userId, selectedPath)
            }
          } catch (e) {
            console.error('Erro ao persistir courseFolderPath:', e)
          }
        }
      } catch (error) {
        console.error('Error selecting folder:', error)
      }
    })
  }
  const renderSectionContent = (): React.JSX.Element => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="pt-12">
            <div className="flex w-full justify-between items-center">
              <div>
                <Label>Select a course folder</Label>
                <p className="text-sm text-muted-foreground">{folderPath}</p>
              </div>
              <Button onClick={() => handleSelectFolder()} disabled={isPending}>
                select folder
              </Button>
            </div>
          </div>
        )

      case 'notifications':
        return <div>notifications</div>
      case 'shortcuts':
        return <div>shortcuts</div>

      case 'security':
        return <div>security</div>

      case 'appearance':
        return <div>appearance</div>

      default:
        return <div></div>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[800px] p-0 gap-0 overflow-hidden">
        <div className="flex h-[80vh]">
          <SidebarContent className="border-r-sidebar-border bg-sidebar w-64 flex-none">
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        className={
                          activeSection === item.id
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : ''
                        }
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="flex-1 p-4 w-full">{renderSectionContent()}</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsDialog
