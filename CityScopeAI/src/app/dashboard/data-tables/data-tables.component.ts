import { Component, OnInit } from '@angular/core';
import { ChartHandler } from './chart-handler';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SliderModule } from 'primeng/slider';

interface Filter {
  name: string;
}

@Component({
  selector: 'app-data-tables',
  standalone: true,
  imports: [
    DropdownModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    SliderModule
  ],
  templateUrl: './data-tables.component.html',
  styleUrls: ['./data-tables.component.css']
})
export class DataTablesComponent implements OnInit {

  filters: Filter[] = [];
  selectedFilter: Filter | undefined;
  searchValue: string = '';

  table: HTMLTableElement | null = null;

  /**
   * Each row is an array of:
   * [City, State, Zip Code, Term, Population, Income, Bachelor Degree, Median Age, Annotation]
   */
  dataRows: string[][] = [];
  filteredRows: string[][] = [];

  async ngOnInit(): Promise<void> {
    await this.loadData();

    // Initialize dropdown filters
    this.filters = [
      { name: 'City' },
      { name: 'State' },
      { name: 'Zipcode' }
    ];
  }

  /**
   * 1) Fetch and parse CSV.
   * 2) Map CSV columns to our table order and add an Annotation column.
   * 3) Build the table with all rows.
   */
  async loadData(): Promise<void> {
    const response = await fetch('../assets/data/merged_enrollment_demographics.csv');
    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);

    // Assume the first line is a header.
    // CSV columns are assumed to be in the following order:
    // [0]: City, [1]: State, [2]: Zip Code, [3]: Population, [4]: Income, [5]: Bachelor Degree, [6]: Median Age, [7]: Term
    // Our table expects: City, State, Zip Code, Term, Population, Income, Bachelor Degree, Median Age, Annotation
    this.dataRows = lines.slice(1).map(line => {
      const columns = line.split(',');
      return [
        columns[0] || '',   // City
        columns[1] || '',   // State
        columns[2] || '',   // Zip Code
        columns[4] || '',   // Term (CSV column 8 becomes our 4th column)
        columns[6] || '',   // Population (CSV column 4 becomes our 5th)
        columns[7] || '',   // Income (CSV column 5 becomes our 6th)
        columns[9] || '',   // Bachelor Degree (CSV column 6 becomes our 7th)
        columns[8] || '',   // Median Age (CSV column 7 becomes our 8th)
        ''                  // Annotation (newly added column)
      ];
    });

    // Initially, all rows are displayed.
    this.filteredRows = [...this.dataRows];

    // Grab the table reference
    this.table = document.getElementById('dataTable') as HTMLTableElement;
    if (!this.table) return;

    // Build the table for the first time (show everything)
    this.updateTable(this.filteredRows);
  }

  /**
   * Clears out <tbody> and rebuilds it with the given data.
   */
  updateTable(rows: string[][]): void {
    if (!this.table) return;

    // Remove any existing table body
    const oldTbody = this.table.querySelector('tbody');
    if (oldTbody) {
      this.table.removeChild(oldTbody);
    }

    // Create a new <tbody>
    const newTbody = this.table.createTBody();

    // For each row in our data, insert cells
    rows.forEach(rowArray => {
      const row = newTbody.insertRow();
      // Create cells for the first 8 columns (displayed in header order)
      rowArray.slice(0, 8).forEach(cellValue => {
        const td = row.insertCell();
        td.textContent = cellValue;
      });
      // Insert the Annotation column as an input field.
      const td = row.insertCell();
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Add annotation';
      input.value = rowArray[8] || '';
      input.addEventListener('input', (event: Event) => {
        const target = event.target as HTMLInputElement;
        rowArray[8] = target.value;
      });
      td.appendChild(input);
    });
  }

  /**
   * Called when the user types in the search bar or changes the dropdown.
   * Filters dataRows based on the selected filter and search value, then rebuilds the table.
   */
  applyFilter(): void {
    if (!this.table || !this.selectedFilter) return;

    // Determine which column to search.
    // Our mapping: 0: City, 1: State, 2: Zip Code.
    let colIndex = 0;
    switch (this.selectedFilter.name) {
      case 'State':
        colIndex = 1;
        break;
      case 'Zipcode':
        colIndex = 2;
        break;
      default:
        colIndex = 0;
    }

    // Perform a case-insensitive search on the specified column.
    const filterText = this.searchValue.toLowerCase();
    this.filteredRows = this.dataRows.filter(row => {
      return row[colIndex].toLowerCase().includes(filterText);
    });

    // Rebuild table with only the filtered rows.
    this.updateTable(this.filteredRows);
  }

  /**
   * Downloads a CSV file containing only the currently filtered rows,
   * including the Annotation column.
   */
  downloadCSV(): void {
    const header = 'City,State,Zip Code,Term,Population,Income,Bachelor Degree,Median Age,Annotation\n';
    let csvContent = header;
    this.filteredRows.forEach(row => {
      const rowData = row.map(cell => {
        // Escape commas and quotes if needed.
        if (cell && (cell.indexOf(',') !== -1 || cell.indexOf('"') !== -1)) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      });
      csvContent += rowData.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'filtered_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  showPieChart(): void {
    if (this.table) {
      ChartHandler.showPieChart('City Distribution', this.table, 0, 'Count');
    }
  }
}
