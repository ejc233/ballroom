import style from "./style.css";
import React from 'react';
import * as Table from 'reactabular-table';
import lib from './common/lib.js';
import Page from './Page.jsx';
import Autocomplete from 'react-autocomplete';
import { browserHistory } from 'react-router';
import classnames from 'classnames';
import CompetitionsTable from './PageCompetitionList/competitions.jsx';
import Box from './common/BoxAdmin.jsx'


import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
// max flow overflow hidden for scrollbar

// /competitions
class PageCompetitionList extends React.Component {
	constructor(props) {
    super(props)
    this.state = {
      /** We will populate this w/ data from the API */
      rows: [],
    }
  }

  componentDidMount() {
    console.log('this', this)

    /* Call the API for competitions info */
    fetch(`/api/admin/${this.props.profile.user_id}/competitions`)
      .then(response => response.json()) // parse the result
      .then(json => { 
        // update the state of our component
        this.setState({ rows : json })
      })
      // todo; display a nice (sorry, there's no connection!) error
      // and setup a timer to retry. Fingers crossed, hopefully the 
      // connection comes back
      .catch(this.refs.page.errorNotif(
        `There was an error fetching the competitions`))
  }

  render() {
    const yourColumns = [
    {
      property: 'Name',
      header: {
        label: 'Name',
        sortable: true,
        resizable: true
      }
    },
    {
      property: 'StartDate',
      header: {
        label: 'Date',
        sortable: true,
        resizable: true
      }
    },
    {
      property: 'Select',
      header: {
        label: '',
        sortable: true,
        resizable: true
      }
    }
  ]

  // Add a button to the competition corresponding to the competition in each row 
  const expand_your_rows = (rows) => {
    for (var i = 0; i < rows.length; i++) {
      let temp = String(rows[i]['id']);
      rows[i]['Select'] = <button className = {style.search}
        onClick = {()=>{ alert("Are you sure?"); browserHistory.push('competition/' + temp + '/0')}}>Visit Page</button>;
    }
    return rows;
  }

  return (
   	<Page ref="page" auth={{ profile: this.props.profile, isAuthenticated: this.props.isAuthenticated }}>
      <div className = {style.content}>
       	<h1>Competitions Page</h1>
           <Box title="Your Competitions"
           content = {
       	  <Table.Provider
          	className = "pure-table pure-table-striped event-table"
          	columns = {yourColumns}>
          	<Table.Header />
          	<Table.Body
              rows = {expand_your_rows(this.state.rows) || []}
              rowKey = "id"
            />
      	  </Table.Provider>
           } />
        <hr />
                              <div className = {styles.addeditBtns}>
                              <button 
                                className={styles.editBtns} 
                                onClick={()=>{ browserHistory.push('editcompetition/0/') }}> 
                                  Add/Edit Event
                              </button>
     	</div>
    </Page>
   );
  }
}

export default DragDropContext(HTML5Backend)(PageCompetitionList)