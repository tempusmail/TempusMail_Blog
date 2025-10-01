import type * as types from 'notion-types'
import { IoClose } from '@react-icons/all-files/io5/IoClose'
import { IoHome } from '@react-icons/all-files/io5/IoHome'
import { IoMenu } from '@react-icons/all-files/io5/IoMenu'
import { IoMoonSharp } from '@react-icons/all-files/io5/IoMoonSharp'
import { IoSearchOutline } from '@react-icons/all-files/io5/IoSearchOutline'
import { IoStarOutline } from '@react-icons/all-files/io5/IoStarOutline'
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline'
import cs from 'classnames'
import Link from 'next/link'
import * as React from 'react'
import { Search, useNotionContext } from 'react-notion-x'

import { isSearchEnabled } from '@/lib/config'
import { useDarkMode } from '@/lib/use-dark-mode'

import styles from './styles.module.css'


function ToggleThemeButton() {
  const [hasMounted, setHasMounted] = React.useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  const onToggleTheme = React.useCallback(() => {
    toggleDarkMode()
  }, [toggleDarkMode])

  return (
    <div
      className={cs('breadcrumb', 'button', !hasMounted && styles.hidden)}
      onClick={onToggleTheme}
    >
      {hasMounted && isDarkMode ? <IoMoonSharp /> : <IoSunnyOutline />}
    </div>
  )
}

export function NotionPageHeader({
  block
}: {
  block: types.CollectionViewPageBlock | types.PageBlock
}) {
  const { components } = useNotionContext()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    }

    updateIsMobile()
    window.addEventListener('resize', updateIsMobile)

    return () => {
      window.removeEventListener('resize', updateIsMobile)
    }
  }, [])

  const toggleMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  const closeMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  // Force custom TempusMail-style navbar regardless of navigationStyle

  return (
    <header className='notion-header'>
      <div className={styles.tempusHeader}>
        <div className={styles.tempusHeaderInner}>
          <div className={styles.brand}>
            <components.Link href="https://tempusmail.com/" className={styles.logoWrap}>
              <img src='/TempusMail.svg' alt='TempusMail' className={styles.logo} />
              <span className={styles.brandText}>TEMPUSMAIL</span>
            </components.Link>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className={styles.headerActions}>
              <Link href='/' className={cs('breadcrumb', 'button')} aria-label='Home' style={{ marginRight: '0.5rem' }}>
                <IoHome />
              </Link>
              {isSearchEnabled && <Search block={block} title={null} />}
              <ToggleThemeButton />
              <components.Link href="https://tempusmail.com/premium" className={styles.premiumButton}>
                <IoStarOutline className={styles.premiumIcon} />
                <span>Premium</span>
              </components.Link>
            </div>
          )}

          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <div className={styles.mobileMenuToggle}>
              <button 
                className={styles.hamburgerButton}
                onClick={toggleMobileMenu}
                aria-label="Open menu"
              >
                {isMobileMenuOpen ? <IoClose /> : <IoMenu />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden search component for mobile to trigger search modal */}
      {isMobile && isSearchEnabled && (
        <div className={styles.hiddenSearchTrigger}>
          <Search block={block} title={null} />
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {isMobile && isMobileMenuOpen && (
        <>
          <div
            className={styles.mobileMenuOverlay}
            onClick={closeMobileMenu}
            aria-hidden='true'
          />
          <div className={styles.mobileSidebar}>
            <div className={styles.mobileMenuHeader}>
              <span className={styles.mobileMenuTitle}>Navigation</span>
              <button
                className={styles.mobileMenuClose}
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                <IoClose />
              </button>
            </div>
            
            <div className={styles.mobileMenuContent}>
              <Link
                href='/'
                className={styles.mobileMenuItem}
                onClick={closeMobileMenu}
              >
                <IoHome />
                <span>Home</span>
              </Link>

              <button
                type='button'
                className={styles.mobileMenuItem}
                onClick={() => {
                  toggleDarkMode()
                  closeMobileMenu()
                }}
              >
                {isDarkMode ? <IoSunnyOutline /> : <IoMoonSharp />}
                <span>Toggle Theme</span>
              </button>

              {isSearchEnabled && (
                <button
                  type='button'
                  className={styles.mobileMenuItem}
                  onClick={() => {
                    // Trigger the search button from the header (desktop search)
                    const searchButton = document.querySelector('.notion-search-button') as HTMLButtonElement
                    if (searchButton) {
                      searchButton.click()
                    }
                  }}
                >
                  <IoSearchOutline />
                  <span>Search</span>
                </button>
              )}

              <components.Link 
                href="https://tempusmail.com/premium" 
                className={styles.mobileMenuItem}
                onClick={closeMobileMenu}
              >
                <IoStarOutline />
                <span>Premium</span>
              </components.Link>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
