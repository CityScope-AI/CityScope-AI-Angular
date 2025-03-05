import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { PrimeNGConfig } from 'primeng/api';
import { ChartModule } from 'primeng/chart';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';


interface Filter {
  name: string;
  columnIndex: number;
}

@Component({
  selector: 'app-data-tables',
  standalone: true,
  imports: [
    DropdownModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    TableModule,
    ChartModule,
    DialogModule,
    CommonModule
  ],
  templateUrl: './data-tables.component.html',
  styleUrls: ['./data-tables.component.css']
})
export class DataTablesComponent implements OnInit {

  @ViewChild('dataTable', { static: false }) tableRef!: ElementRef; // Reference to p-table


  showChart: boolean = false; // Flag to show/hide the chart
  data: any;
  options: any;

  visible: boolean = false;

    showDialog() {
        this.visible = true;
    }

  constructor(private primengConfig: PrimeNGConfig) {}

  filters: Filter[] = [
    { name: 'City', columnIndex: 0 },
    { name: 'State', columnIndex: 1 },
    { name: 'Zip Code', columnIndex: 2 }
  ];

  selectedFilter: Filter | undefined;
  searchValue: string = '';

  dataRows: string[][] = []; // Original full dataset
  filteredDataRows: string[][] = []; // Filtered dataset for display

  async ngOnInit(): Promise<void> {
    await this.loadData();
    this.primengConfig.ripple = true; // Enable button ripple effect

    const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');

        this.data = {
            labels: ['A', 'B', 'C'],
            datasets: [
                {
                    data: [540, 325, 702],
                    backgroundColor: [documentStyle.getPropertyValue('--blue-500'), documentStyle.getPropertyValue('--yellow-500'), documentStyle.getPropertyValue('--green-500')],
                    hoverBackgroundColor: [documentStyle.getPropertyValue('--blue-400'), documentStyle.getPropertyValue('--yellow-400'), documentStyle.getPropertyValue('--green-400')]
                }
            ]
        };

        this.options = {
            plugins: {
                legend: {
                    labels: {
                        usePointStyle: true,
                        color: textColor
                    }
                }
            }
        };

  }

  /*
   * Loads CSV data into `dataRows` and initializes `filteredDataRows`.
   */
  async loadData(): Promise<void> {
    const response = await fetch('../assets/data/merged_enrollment_demographics.csv');
    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/);

    // Skip headers and load data
    this.dataRows = lines.slice(1).map(line => line.split(','));

    // Initially display all data
    this.filteredDataRows = [...this.dataRows];
  }

  /**
   * Filters the dataset based on selected dropdown and search input.
   */
  applyFilter(): void {
    if (!this.selectedFilter || !this.searchValue.trim()) {
      // If no filter is selected or input is empty, show all data
      this.filteredDataRows = [...this.dataRows];
      return;
    }

    const colIndex = this.selectedFilter.columnIndex;
    const filterText = this.searchValue.toLowerCase();

    // Filter dataset dynamically
    this.filteredDataRows = this.dataRows.filter(row =>
      row[colIndex]?.toLowerCase().includes(filterText)
    );
  }

  // showPieChart(): void {

  //   this.data = {
  //     labels: ['City A', 'City B', 'City C'],
  //     datasets: [
  //       {
  //         data: [40, 30, 30], // Example data (modify as needed)
  //         backgroundColor: ['#42A5F5', '#FFC107', '#66BB6A'],
  //         hoverBackgroundColor: ['#64B5F6', '#FFCA28', '#81C784']
  //       }
  //     ]
  //   };

  //   this.options = {
  //     plugins: {
  //       legend: {
  //         position: 'top'
  //       }
  //     }
  //   };
  // }
}
