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
   * We'll keep the raw CSV rows in this array so we can filter/rebuild the table.
   * Each element of dataRows is an array of cell values for a single row.
   */
  dataRows: string[][] = [];

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
   * 2) Store all row data in memory (dataRows).
   * 3) Build the table initially with all rows.
   */
  async loadData(): Promise<void> {
    const response = await fetch('../assets/data/merged_enrollment_demographics.csv');
    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/);

    // The first line is typically headers, so skip it:
    this.dataRows = lines.slice(1).map(line => line.split(','));

    // Grab the table reference
    this.table = document.getElementById('dataTable') as HTMLTableElement;
    if (!this.table) return;

    // Build the table for the first time (show everything)
    this.updateTable(this.dataRows);
  }

  /**
   * Clear out <tbody> and rebuild it with the given data.
   */
  updateTable(rows: string[][]): void {
    if (!this.table) return;

    // Remove any existing table body
    let oldTbody = this.table.querySelector('tbody');
    if (oldTbody) {
      this.table.removeChild(oldTbody);
    }

    // Create a new <tbody>
    const newTbody = this.table.createTBody();

    // For each row in our data, insert into table
    rows.forEach(rowArray => {
      const row = newTbody.insertRow();
      // Only take the first 8 columns
      rowArray.slice(0, 8).forEach(cellValue => {
        const td = row.insertCell();
        td.textContent = cellValue;
      });
    });
  }

  /**
   * Called whenever user types in the search bar or changes the dropdown.
   * Filter dataRows based on selectedFilter + searchValue, then rebuild table.
   */
  applyFilter(): void {
    if (!this.table || !this.selectedFilter) return;

    // Figure out which column index to search
    let colIndex = 0;
    switch (this.selectedFilter.name) {
      case 'State':
        colIndex = 1;
        break;
      case 'Zipcode':
        colIndex = 2;
        break;
      default:
        // Default to "City" column
        colIndex = 0;
    }

    // Perform a case-insensitive search
    const filterText = this.searchValue.toLowerCase();
    const filteredRows = this.dataRows.filter(row => {
      return row[colIndex].toLowerCase().includes(filterText);
    });

    // Now rebuild table with only the filtered rows
    this.updateTable(filteredRows);
  }

  showPieChart(): void {
    if (this.table) {
      ChartHandler.showPieChart('City Distribution', this.table, 0, 'Count');
    }
  }
}
