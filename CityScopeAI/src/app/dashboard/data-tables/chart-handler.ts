import Chart, { ChartConfiguration, FontSpec } from 'chart.js/auto';

export class ChartHandler {
    public static showPieChart(title: string, table: HTMLTableElement, categoryColumnIndex: number, unit: string): void {
        const dataset: { [key: string]: number } = {};
        const categoryCounts: { [key: string]: number } = {};

        // Count occurrences of each category
        const tbody = table.tBodies[0];
        for (let i = 0; i < tbody.rows.length; i++) {
            const row = tbody.rows[i];
            const cell = row.cells[categoryColumnIndex];
            const category = cell.textContent ? cell.textContent.trim() : "";
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }

        // Sort categories by count and limit the number of displayed slices
        const maxSlices = 10;
        const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

        let displayedCount = 0;
        let otherCount = 0;

        for (const entry of sortedCategories) {
            if (displayedCount < maxSlices) {
                dataset[entry[0]] = entry[1];
                displayedCount++;
            } else {
                otherCount += entry[1];
            }
        }

        if (otherCount > 0) {
            dataset["Other"] = otherCount;
        }

        // Prepare data for Chart.js
        const labels = Object.keys(dataset);
        const data = Object.values(dataset);

        // Add units to the title
        let finalTitle = title;
        if (unit && unit.trim() !== "") {
            finalTitle = `${title} (${unit})`;
        }

        // Create modal for displaying chart
        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = "50%";
        modal.style.left = "50%";
        modal.style.transform = "translate(-50%, -50%)";
        modal.style.backgroundColor = "#fff";
        modal.style.border = "1px solid #000";
        modal.style.zIndex = "1000";
        modal.style.padding = "10px";
        modal.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
        modal.style.width = "800px";
        modal.style.height = "600px";
        modal.style.display = "flex";
        modal.style.flexDirection = "column";

        // Create title element
        const titleElement = document.createElement("h2");
        titleElement.textContent = finalTitle;
        modal.appendChild(titleElement);

        // Create canvas for Chart.js
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 500;
        modal.appendChild(canvas);

        // Customize Pie Chart options

const config: ChartConfiguration<'pie', number[], string> = {
    type: 'pie',
    data: {
        labels: labels,
        datasets: [{
            data: data,
            backgroundColor: [
                "#FF6384", "#36A2EB", "#FFCE56", "#8A2BE2", "#00FA9A",
                "#FF4500", "#00CED1", "#FFD700", "#40E0D0", "#FF69B4", "#A9A9A9"
            ]
        }]
    },
    options: {
        plugins: {
            legend: {
                labels: {
                    font: {
                        family: "SansSerif",
                        size: 12
                    } as Partial<FontSpec>
                }
            },
            tooltip: {}
        },
        maintainAspectRatio: false
    }
};


        // Create the pie chart
        new Chart(canvas.getContext("2d") as CanvasRenderingContext2D, config);

        // Create close button for the modal
        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.style.alignSelf = "flex-end";
        closeButton.addEventListener("click", () => {
            document.body.removeChild(modal);
        });
        modal.appendChild(closeButton);

        // Display Pie Chart by adding modal to the document body
        document.body.appendChild(modal);
    }
}
