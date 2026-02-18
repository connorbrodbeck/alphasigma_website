import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { TrendingUp, Users, Building2, Target } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import lionLogo from "@/assets/lion-logo.png"

interface AppSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { 
    id: "portfolio", 
    title: "Portfolio", 
    icon: TrendingUp,
    description: "Performance & Holdings"
  },
  { 
    id: "about", 
    title: "About Us", 
    icon: Building2,
    description: "Company Overview"
  },
  { 
    id: "people", 
    title: "People", 
    icon: Users,
    description: "Our Team"
  },
  { 
    id: "strategies", 
    title: "Strategies", 
    icon: Target,
    description: "Investment Approach"
  },
]

export function AppSidebar({ activeTab, setActiveTab }: AppSidebarProps) {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  const isActive = (id: string) => activeTab === id

  return (
    <Sidebar
      className="border-r border-gold/20 bg-card/50 backdrop-blur-sm"
      collapsible="icon"
    >
      <SidebarContent>
        {/* Logo Section */}
        <div className={`p-4 border-b border-gold/20 ${collapsed ? "px-2" : ""}`}>
          <div className="flex items-center space-x-3">
            <img 
              src={lionLogo} 
              alt="Alpha Sigma Logo" 
              className="w-8 h-8 object-contain"
            />
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-gold to-amber-400 bg-clip-text text-transparent">
                  Alpha Sigma
                </h1>
                <p className="text-xs text-muted-foreground">Strategies</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild 
                    className={`
                      transition-all duration-300 mb-1
                      ${isActive(item.id) 
                        ? "bg-gold/20 text-gold border-r-2 border-gold" 
                        : "text-muted-foreground hover:text-foreground hover:bg-navy-light/50"
                      }
                    `}
                  >
                    <button 
                      onClick={() => setActiveTab(item.id)}
                      className="w-full flex items-center space-x-3 p-3 rounded-md"
                    >
                      <item.icon className={`h-5 w-5 ${isActive(item.id) ? "text-gold" : ""}`} />
                      {!collapsed && (
                        <div className="flex-1 text-left">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className={`p-4 border-t border-gold/20 ${collapsed ? "px-2" : ""}`}>
          {!collapsed && (
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">AUM</div>
              <div className="text-sm font-bold text-gold">$2.8B</div>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}