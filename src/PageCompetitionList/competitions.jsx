import React from 'react';
import * as Table from 'reactabular-table';
import * as resolve from 'table-resolver';
import * as dnd from 'reactabular-dnd';
import * as easy from 'reactabular-easy';
import VisibilityToggles from 'react-visibility-toggles';
import * as resizable from 'reactabular-resizable';
import * as search from 'searchtabular';
import HTML5Backend from 'react-dnd-html5-backend';
import { compose } from 'redux';
import uuid from 'uuid';
import cloneDeep from 'lodash/cloneDeep';
import findIndex from 'lodash/findIndex';
import style from '../style.css';
import { browserHistory } from 'react-router';

const schema = {
  type: 'object',
  properties: {
    id: {
      type: 'integer'
    },
	name: {
	  type: 'string'
	},
	price: {
	  type: 'int'
	},
	reg_deadline: {
	  type: 'string'
	}
  },
  required: ['id', 'name', 'price', 'reg_deadline'],
};

class CompetitionsTable extends React.Component {
  constructor(props) {
		super(props);

		this.rows = null;
		this.state = {
		  rows: [],
		  columns: this.getColumns(),
		  sortingColumns: {},
		  query: {},
  	  };
		this.table = null;
  }

  componentWillMount() {
    this.resizableHelper = resizable.helper({
	  globalId: uuid.v4(),
	  getId: ({ id }) => id
	  });
  }

  componentWillUnmount() {
	  this.resizableHelper.cleanup();
  }

  getColumns() {
	  return [
      {
      	id: 'name',
		    property: 'name',
		    header: {
		        label: 'Name',
		        sortable: true,
		        resizable: true
		    },
		    cell: {
		        highlight: true
		    },
		    width: 250
		 	},
		 	{
		    id: 'price',
		    property: 'regularprice',
		    header: {
		      label: 'Price',
		      sortable: true,
		      resizable: true
		    },
		    cell: {
		        highlight: true
		    },
		    width: 50
		 	},
		 	{
		    id: 'reg_deadline',
		    property: 'regularregdeadline',
		    header: {
		      label: 'Reg Deadline',
		      sortable: true,
		      resizable: true
		    },
		    cell: {
		      highlight: true
		    },
		    width: 150
		 	},
		 	{
		    cell: {
		      formatters: [
            (value, { rowData }) => (
              <div>
                <input type="button"
                	value="Register"
                	onClick={() => browserHistory.push('competition/1/eventregistration')} />
			        </div>
		          )
		 			]
		 		},
		    width: 100
		 },
		];
	}

  componentDidMount() {
      fetch("api/competitions/1/unregistered")
		   .then(response => response.json())
		   .then(json => {
          this.rows = json;
          for (let i = 0; i < this.rows.length; i++) {
            this.rows[i].regularprice = "$" + (this.rows[i].regularprice || 0);
            this.rows[i].lateprice = "$" + (this.rows[i].lateprice || 0);
		    	}
		     this.setState({ rows: json, }); 
		 })
		   .catch(err => alert(err));
  }

  render() {
    const components = {
      header: {
        wrapper: 'thead',
        row: 'tr',
        cell: 'th'
      },
      body: {
        row: dnd.Row
      }
    };

    const { columns, rows, query } = this.state;
    const cols = columns;
    const visibleRows = compose(
      search.multipleColumns({ columns: cols, query }),
      resolve.resolve({
		     columns: cols,
		     method: (extra) => compose(
                resolve.byFunction('cell.resolve')(extra),
                resolve.nested(extra)
            )
		 })
    )(rows);

	  for (let i = 0; i < rows.length; i++) {
	    rows[i].id = (i + 1);
	  }

	  const headerRows = resolve.headerRows({
	    columns: columns
	  });

	  const tableHeight = 40 * (rows.length)

	  return (
        <Table.Provider
          className = {style.tableWrapper}
          columns = {columns}
          components = {components}
        >
          <Table.Header
            className = {style.tableHeader}
            >
            <search.Columns
              query = {query}
              columns = {columns}
              onChange = {query => this.setState({ query })}
            />
          </Table.Header>
          <Table.Body
            rows={visibleRows}
            rowKey="id"
            className={style.tableBody}
          />
        </Table.Provider>
      );
  }

  _onFilterChange(cellDataKey, event) {
    if (!event.target.value) {
      this.setState({ filteredDataList: this.rows });
    }
    var filterBy = event.target.value.toString().toLowerCase();
    var size = this.rows.length;
    var filteredList = [];
    for (var index = 0; index < size; index++) {
        var v = this.rows[index][cellDataKey];
        if (v.toString().toLowerCase().indexOf(filterBy) !== -1) {
            filteredList.push(this.rows[index]);
		}
	}
    this.setState({
	    filteredDataList: filteredList,
    });
  }
}
export default CompetitionsTable