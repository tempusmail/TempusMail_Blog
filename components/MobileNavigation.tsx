import type * as types from 'notion-types'
import { IoClose } from '@react-icons/all-files/io5/IoClose'
import { IoHome } from '@react-icons/all-files/io5/IoHome'
import { IoMoonSharp } from '@react-icons/all-files/io5/IoMoonSharp'
import { IoSearch } from '@react-icons/all-files/io5/IoSearch'
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline'
import Link from 'next/link'
import * as React from 'react'
import { Search, useNotionContext } from 'react-notion-x'

import { isSearchEnabled } from '@/lib/config'
import { useDarkMode } from '@/lib/use-dark-mode'

import styles from './styles.module.css'

interface MobileNavigationContextType {
  isOpen: boolean
  isSearchOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
}

const MobileNavigationContext = React.createContext<MobileNavigationContextType | null>(null)

export function useMobileNavigation() {
  const context = React.useContext(MobileNavigationContext)
  if (!context) {
    throw new Error('useMobileNavigation must be used within MobileNavigationProvider')
  }
  return context
}

interface MobileNavigationProviderProps {
  children: React.ReactNode
  block?: types.CollectionViewPageBlock | types.PageBlock
}

export function MobileNavigationProvider({ children, block }: MobileNavigationProviderProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)

  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => {
    setIsOpen(false)
    setIsSearchOpen(false) // Also close search when sidebar closes
  }, [])
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), [])

  const openSearch = React.useCallback(() => {
    setIsSearchOpen(true)
    setIsOpen(false) // Close sidebar when opening search
  }, [])
  const closeSearch = React.useCallback(() => setIsSearchOpen(false), [])
  const toggleSearch = React.useCallback(() => {
    if (isSearchOpen) {
      setIsSearchOpen(false)
    } else {
      setIsSearchOpen(true)
      setIsOpen(false) // Close sidebar when opening search
    }
  }, [isSearchOpen])

  const value = React.useMemo(() => ({
    isOpen,
    isSearchOpen,
    open,
    close,
    toggle,
    openSearch,
    closeSearch,
    toggleSearch
  }), [isOpen, isSearchOpen, open, close, toggle, openSearch, closeSearch, toggleSearch])

  return (
    <MobileNavigationContext.Provider value={value}>
      {children}
      <MobileSidebar isOpen={isOpen} onClose={close} />
      {isSearchOpen && <MobileSearchOverlay onClose={closeSearch} block={block} />}
    </MobileNavigationContext.Provider>
  )
}

interface MobileSearchOverlayProps {
  onClose: () => void
  block?: types.CollectionViewPageBlock | types.PageBlock
}

function MobileSearchOverlay({ onClose, block }: MobileSearchOverlayProps) {
  // Close search when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Close search on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className={styles.mobileSearchOverlay} onClick={handleBackdropClick}>
      <div className={styles.mobileSearchContainer}>
        <div className={styles.mobileSearchContent}>
          {isSearchEnabled && block && (
            <div className={styles.mobileSearchWrapper}>
              <Search block={block} title={null} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  block?: types.CollectionViewPageBlock | types.PageBlock
}

function MobileSidebar({ isOpen, onClose }: Omit<MobileSidebarProps, 'block'>) {
  const [hasMounted, setHasMounted] = React.useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { components } = useNotionContext()
  const { toggleSearch } = useMobileNavigation()

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  const onToggleTheme = React.useCallback(() => {
    toggleDarkMode()
  }, [toggleDarkMode])

  const handleSearchClick = React.useCallback(() => {
    toggleSearch() // This will close sidebar and open search
  }, [toggleSearch])

  // Close sidebar when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Prevent body scroll when sidebar is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className={styles.mobileMenuOverlay} onClick={handleBackdropClick}>
      <div className={styles.mobileSidebar}>
        <div className={styles.mobileMenuHeader}>
          <div className={styles.mobileMenuTitle}>Menu</div>
          <button 
            className={styles.mobileMenuClose} 
            onClick={onClose}
            aria-label="Close menu"
          >
            <IoClose />
          </button>
        </div>
        
        <nav className={styles.mobileMenuContent}>
          <Link href='/' className={styles.mobileMenuItem} onClick={onClose}>
            <IoHome />
            <span>Home</span>
          </Link>
          
          {isSearchEnabled && (
            <button 
              className={styles.mobileMenuItem}
              onClick={handleSearchClick}
            >
              <IoSearch />
              <span>Search</span>
            </button>
          )}
          
          <button 
            className={styles.mobileMenuItem}
            onClick={() => {
              onToggleTheme()
              onClose()
            }}
          >
            {hasMounted && isDarkMode ? <IoMoonSharp /> : <IoSunnyOutline />}
            <span>{hasMounted && isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <components.Link 
            href="https://tempusmail.com/premium" 
            className={styles.mobilePremiumButton}
            onClick={onClose}
          >
            Premium
          </components.Link>
        </nav>
      </div>
    </div>
  )
}