import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';       // REQUIRED for standalone components
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SliderModule } from 'primeng/slider';
import { ChartHandler } from './chart-handler';

interface Filter {
  name: string;
}

@Component({
  selector: 'app-data-tables',
  standalone: true,
  imports: [
    CommonModule,        // Make sure CommonModule is here
    DropdownModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    SliderModule         // Make sure SliderModule is here
  ],
  templateUrl: './data-tables.component.html',
  styleUrls: ['./data-tables.component.css']
})
export class DataTablesComponent implements OnInit {

  filters: Filter[] = [];
  selectedFilter: Filter | undefined;
  searchValue: string = '';

  // Slider values for numeric filtering
  sliderValue: number[] = [0, 100];
  sliderMin: number = 0;
  sliderMax: number = 100;

  table: HTMLTableElement | null = null;

  dataRows: string[][] = [];
  filteredRows: string[][] = [];

  // Helper: Determines if the current filter is numeric
  isNumericFilter(filterName: string | undefined): boolean {
    return filterName === 'Population' ||
           filterName === 'Income' ||
           filterName === 'Bachelor Degree' ||
           filterName === 'Median Age';
  }

  // Pre-defined numeric ranges (adjust as needed)
  numericColumnsRange: { [key: string]: { min: number, max: number } } = {
    'Population':      { min: 0, max: 1000000 },
    'Income':          { min: 0, max: 200000 },
    'Bachelor Degree': { min: 0, max: 100 },
    'Median Age':      { min: 0, max: 120 }
  };

  async ngOnInit(): Promise<void> {
    await this.loadData();

    this.filters = [
      { name: 'City' },
      { name: 'State' },
      { name: 'Zip Code' },
      { name: 'Term' },
      { name: 'Population' },
      { name: 'Income' },
      { name: 'Bachelor Degree' },
      { name: 'Median Age' }
    ];
  }

  async loadData(): Promise<void> {
    const response = await fetch('../assets/data/merged_enrollment_demographics.csv');
    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);

    // Map CSV columns to our table columns:
    // columns[0] = City
    // columns[1] = State
    // columns[2] = Zip Code
    // columns[4] = Term
    // columns[6] = Population
    // columns[7] = Income
    // columns[9] = Bachelor Degree
    // columns[8] = Median Age
    this.dataRows = lines.slice(1).map(line => {
      const columns = line.split(',');
      return [
        columns[0] || '',    // City
        columns[1] || '',    // State
        columns[2] || '',    // Zip Code
        columns[4] || '',    // Term
        columns[6] || '',    // Population
        columns[7] || '',    // Income
        columns[9] || '',    // Bachelor Degree
        columns[8] || '',    // Median Age
        ''                   // Annotation
      ];
    });

    this.filteredRows = [...this.dataRows];

    this.table = document.getElementById('dataTable') as HTMLTableElement;
    if (!this.table) return;

    this.updateTable(this.filteredRows);
  }

  onFilterChange(): void {
    if (!this.selectedFilter) return;
    if (this.isNumericFilter(this.selectedFilter.name)) {
      const range = this.numericColumnsRange[this.selectedFilter.name];
      this.sliderMin = range.min;
      this.sliderMax = range.max;
      this.sliderValue = [range.min, range.max];
      // Clear any text filter value
      this.searchValue = '';
    }
  }

  updateTable(rows: string[][]): void {
    if (!this.table) return;
    const oldTbody = this.table.querySelector('tbody');
    if (oldTbody) {
      this.table.removeChild(oldTbody);
    }
    const newTbody = this.table.createTBody();

    rows.forEach(rowArray => {
      const row = newTbody.insertRow();
      rowArray.slice(0, 8).forEach(cellValue => {
        const td = row.insertCell();
        td.textContent = cellValue;
      });
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

  applyFilter(): void {
    if (!this.table || !this.selectedFilter) return;
    let colIndex = 0;
    switch (this.selectedFilter.name) {
      case 'State': colIndex = 1; break;
      case 'Zip Code': colIndex = 2; break;
      case 'Term': colIndex = 3; break;
      case 'Population': colIndex = 4; break;
      case 'Income': colIndex = 5; break;
      case 'Bachelor Degree': colIndex = 6; break;
      case 'Median Age': colIndex = 7; break;
      default: colIndex = 0;
    }

    if (this.isNumericFilter(this.selectedFilter.name)) {
      const [minVal, maxVal] = this.sliderValue;
      this.filteredRows = this.dataRows.filter(row => {
        const numericVal = parseFloat(row[colIndex]) || 0;
        return numericVal >= minVal && numericVal <= maxVal;
      });
    } else {
      const filterText = this.searchValue.toLowerCase();
      this.filteredRows = this.dataRows.filter(row => {
        return row[colIndex].toLowerCase().includes(filterText);
      });
    }
    this.updateTable(this.filteredRows);
  }

  downloadCSV(): void {
    const header = 'City,State,Zip Code,Term,Population,Income,Bachelor Degree,Median Age,Annotation\n';
    let csvContent = header;
    this.filteredRows.forEach(row => {
      const rowData = row.map(cell => {
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
