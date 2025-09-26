// Social media icon imports removed
import { IoHome } from '@react-icons/all-files/io5/IoHome'
import { IoMoonSharp } from '@react-icons/all-files/io5/IoMoonSharp'
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline'
import * as React from 'react'

import * as config from '@/lib/config'
import { useDarkMode } from '@/lib/use-dark-mode'

import styles from './styles.module.css'

// TODO: merge the data and icons from PageSocial with the social links in Footer


export function FooterImpl() {
  const [hasMounted, setHasMounted] = React.useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const currentYear = new Date().getFullYear()

  const onToggleDarkMode = React.useCallback(
    (e: any) => {
      e.preventDefault()
      toggleDarkMode()
    },
    [toggleDarkMode]
  )

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  return (
    <footer className={styles.footer}>


       <div>
        <div className={styles.footerSection}>
          <a href='/' className={styles.homeButton} title='Home'>
            <IoHome />
          </a>
        </div>
      </div>
      <div className={styles.copyright}>
        Copyright {currentYear} {config.author}
      </div>

     

      <div className={styles.settings}>
        {hasMounted && (
          <a
            className={styles.toggleDarkMode}
            href='#'
            role='button'
            onClick={onToggleDarkMode}
            title='Toggle dark mode'
          >
            {isDarkMode ? <IoMoonSharp size={15}/> : <IoSunnyOutline />}
          </a>
        )}
      </div>

      {/* Social media icons removed */}
    </footer>
  )
}

export const Footer = React.memo(FooterImpl)
