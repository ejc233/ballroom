import styles from "./base.css"
import React from 'react'
import XSidebar from './common/XSidebar.jsx'

/**
 * Standard page layout and utilities all pages might need.
 */
export default class Page extends React.Component {

  render () {
    const { children } = this.props
    return (
      <section className = {styles.container}>
        <XSidebar {...this.props}/>
        <div className = {styles.content}>
          {children}
        </div>
      </section>
    );
  }
}
