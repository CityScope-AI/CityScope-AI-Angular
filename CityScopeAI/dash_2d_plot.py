# --------------------------------------------------------------------------------
# Author:       Tim Allec
# File name:    dash_2d_plot.py
# Date Created: 2024-09-13
#
# Description: This script loads demographic data from a CSV file
#              named 'census_zipcode_demographics_2022.csv'. It performs t-SNE
#              dimensionality reduction to project the data into 2D space and creates
#              a 2D visualization using Plotly. The visualization shows CBU ZIP codes
#              in light blue and the 100 most demographically similar non-CBU ZIP codes
#              in yellow, with their most similar CBU ZIP code and similarity score
#              displayed on hover.
#
# Usage: Execute this script to generate the 2D t-SNE plot. Ensure the CSV file
#        is in the root directory.
# --------------------------------------------------------------------------------

import os
import json
import numpy as np
import dash
from dash import dcc, html
import plotly.graph_objs as go
import pandas as pd
from sklearn.manifold import TSNE
from sklearn.metrics.pairwise import euclidean_distances
from sklearn.preprocessing import StandardScaler
from dash.dependencies import Input, Output, State

import os
import requests
from dotenv import load_dotenv

from dash import ctx, dcc, html, Input, Output, State, callback_context
from urllib.parse import urlparse, parse_qs

# Load environment variables
# load_dotenv(".env.local")
API_KEY = "9483b67849b146aa53e7eadd44603390bdf35c615645d3f8e036df482b5c37af"

def generate_similarity_explanation(zip1, zip2, zip1_data, zip2_data):
    """
    Generate an LLM-powered similarity explanation between two ZIP codes.
    """
    API_URL = "https://api.together.xyz/v1/completions"

    prompt = f"""
    Compare ZIP Code {zip1} and ZIP Code {zip2} in a detailed paragraph.
    - Population: {zip1} has {zip1_data['Population']}, while {zip2} has {zip2_data['Population']}.
    - Median Income: {zip1_data['Median_Income']} vs. {zip2_data['Median_Income']}.
    - Bachelor's Degree Holders: {zip1_data['Bachelor_Degree']}% vs. {zip2_data['Bachelor_Degree']}%.
    - Unemployment Rate: {zip1_data['Unemployment']}% vs. {zip2_data['Unemployment']}%.
    - Median Home Value: {zip1_data['Median_Home_Value']} vs. {zip2_data['Median_Home_Value']}.
    - Ethnic Composition:
    - White Alone: {zip1_data['White_Alone']}% vs. {zip2_data['White_Alone']}%.
    - Black Alone: {zip1_data['Black_Alone']}% vs. {zip2_data['Black_Alone']}%.
    - Hispanic or Latino: {zip1_data['Hispanic_Latino']}% vs. {zip2_data['Hispanic_Latino']}%.

    Summarize the similarities and differences in one paragraph. Do not hallucinate about where we got this data from.
    """

    payload = {
        "model": "mistralai/Mistral-7B-Instruct-v0.1",
        "prompt": prompt.strip(),
        "max_tokens": 250,
        "temperature": 0.3
    }

    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

    response = requests.post(API_URL, headers=headers, json=payload)
    if response.status_code == 200:
        return response.json()["choices"][0]["text"].strip()
    return "Explanation unavailable due to API error."


csv_file_path = './src/assets/data/census_zipcode_percentages.csv'
census_data = pd.read_csv(csv_file_path)
enrollment_data = pd.read_csv('./src/assets/data/enrollment 2019-2023.csv')

# Ensure both ZIP Code columns are strings for proper merging
census_data['Zip_Code'] = census_data['Zip_Code'].astype(str).str.strip()
enrollment_data['Mailing Zip/Postal Code'] = enrollment_data['Mailing Zip/Postal Code'].astype(str).str.strip()



# strip and stringify zip codes
census_data['Zip_Code'] = census_data['Zip_Code'].astype(str).str.strip()

# Replace NULL (NaN) values with 0 or the median avg for that column
census_data.fillna({
    'Population': 0,
    'Median_Income': census_data['Median_Income'].median(),
    'Bachelor_Degree': 0,
    'Graduate_Professional_Degree': 0,
    'White_Alone': 0,
    'Black_Alone': 0,
    'Hispanic_Latino': 0,
    'Unemployment': census_data['Unemployment'].median(),
    'Median_Home_Value': census_data['Median_Home_Value'].median()
}, inplace=True)

cbu_zipcodes = [
    '92503', '92504', '92508', '92506', '92880', '92571', '92336', '92509',
    '92882', '92399', '92881', '92505', '92223', '92557', '92553', '92555',
    '91709', '92879', '92584', '92883', '92507', '92374', '92562', '91752',
    '91710', '92335', '92570', '92407', '92324', '91739', '92592', '92376',
    '92563', '92346', '92373', '92860', '92530', '92337', '92551', '91761',
    '92404', '91737', '92532', '92544', '91762', '92308', '92545', '92392',
    '91701', '92583'
]

# filter and find CBU zip codes within the dataset
cbu_census_data = census_data[census_data['Zip_Code'].isin(cbu_zipcodes)]

features = ['Population', 'Median_Income', 'Bachelor_Degree', 'Graduate_Professional_Degree',
            'White_Alone', 'Black_Alone', 'Hispanic_Latino', 'Unemployment', 'Median_Home_Value']

# standardize
scaler = StandardScaler()
cbu_census_data_scaled = scaler.fit_transform(cbu_census_data[features])

# find non-CBU zip codes
non_cbu_census_data = census_data[~census_data['Zip_Code'].astype(str).isin(cbu_zipcodes)]
non_cbu_census_data_scaled = scaler.transform(non_cbu_census_data[features])

# calculate Euclidean distance between non-CBU zip codes & centroid of CBU zip codes (average position)
# distancing on the 2d-map
cbu_centroid = np.mean(cbu_census_data_scaled, axis=0)
distances = euclidean_distances(non_cbu_census_data_scaled, [cbu_centroid])

# calculate indices of the top 100 closest non-CBU zip codes
top_100_indices = np.argsort(distances, axis=0)[:100].flatten()

# select top 100 most similar non-CBU zip codes
top_100_non_cbu_census_data = non_cbu_census_data.iloc[top_100_indices]
top_100_non_cbu_census_data_scaled = non_cbu_census_data_scaled[top_100_indices]

# find closest CBU ZIP codes for each node
euclidean_dist = euclidean_distances(top_100_non_cbu_census_data_scaled, cbu_census_data_scaled)
closest_cbu_indices = np.argmin(euclidean_dist, axis=1)
closest_cbu_zipcodes = cbu_census_data.iloc[closest_cbu_indices]['Zip_Code'].values

# calculate similarity scores
closest_distances = np.min(euclidean_dist, axis=1)
similarity_scores = 1 / closest_distances

# perform t-SNE to reduce the data to 2D
tsne = TSNE(n_components=2, random_state=42, perplexity=10, learning_rate=200, init='random')

# combine the data before applying t-SNE
combined_data_scaled = np.vstack([cbu_census_data_scaled, top_100_non_cbu_census_data_scaled])
combined_coords = tsne.fit_transform(combined_data_scaled)

# define coordinates for 2d graph
cbu_coords = combined_coords[:len(cbu_census_data)]
non_cbu_coords = combined_coords[len(cbu_census_data):]

def generate_hover_info(data):
    hover_info = []
    for _, row in data.iterrows():
        hover_text = f"ZIP: {row['Zip_Code']}<br>" \
                     f"Population: {int(row['Population'])}<br>" \
                     f"Median Income: {int(row['Median_Income'])}<br>" \
                     f"Education (Bachelors): {row['Bachelor_Degree']:.1f}%<br>" \
                     f"Unemployment: {row['Unemployment']:.1f}%<br>" \
                     f"Median Home Value: {int(row['Median_Home_Value'])}"

        hover_info.append(hover_text)

    return hover_info

        # if closest_cbu_zipcodes is not None and similarity_scores is not None:
        #     hover_text += f"<br>Most Similar CBU ZIP: {closest_cbu_zipcodes[i]}" \
        #                   f"<br>Similarity Score: {similarity_scores[i]:.2f}"




app = dash.Dash(__name__)

@app.callback(
    Output('cbu-zipcode-dropdown', 'value'),
    Input('url', 'href')
)
def preselect_zip_from_url(href):
    if not href:
        return 'all'

    parsed_url = urlparse(href)
    query_params = parse_qs(parsed_url.query)
    selected_zip = query_params.get('selected_zip', ['all'])[0]

    if selected_zip in cbu_zipcodes:
        return selected_zip
    return 'all'



# App layout
app.layout = html.Div([
    dcc.Location(id='url', refresh=False),  # Add to your layout
    html.Div([

        # Sidebar with filter options
        html.Div([
            html.Button("☰", id="toggle-button", n_clicks=0, style={
                'position': 'absolute',
                'top': '10px',
                'left': '10px',
                'fontSize': '24px',
                'cursor': 'pointer',
                'background-color': 'lightgray',
                'zIndex': '2',
            }),

            html.Div([
                # Adding marginTop using wrapper Div
                html.Div([
                    # Demographic Dimension Dropdown
                    html.Label("Select Demographic Dimension:"),
                    dcc.Dropdown(
                        id='dimension-dropdown',
                        options=[
                            {'label': 'Generalized', 'value': 'generalized'},
                            {'label': 'Economic Prosperity', 'value': 'economic_prosperity'},
                            {'label': 'Educational Attainment', 'value': 'educational_attainment'},
                            {'label': 'Population Density and Urbanization', 'value': 'population_density'},
                            {'label': 'Ethnic Diversity', 'value': 'ethnic_diversity'}
                        ],
                        value='generalized'  # Default value
                    )
                ], style={'marginTop': '3vw'}),  # Add spacing above the dropdown

                html.Div([
                    html.Div([
                        html.Label("Select Feature to Filter By:"),
                        dcc.Dropdown(
                            id='feature-dropdown',
                            options=[
                                {'label': 'Population', 'value': 'Population'},
                                {'label': 'Median Income', 'value': 'Median_Income'},
                                {'label': 'Education (Bachelors)', 'value': 'Bachelor_Degree'},
                                {'label': 'Unemployment', 'value': 'Unemployment'},
                                {'label': 'Median Home Value', 'value': 'Median_Home_Value'}
                            ],
                            value='Population'  # Default value
                        )
                    ], style={'marginTop': '1vw'}),  # Add spacing above the dropdown

                    html.Div([
                        html.Label(id='slider-label', children="Filter by Population Range:"),
                        dcc.RangeSlider(
                            id='feature-slider',
                            min=0,  # Replace with dynamic min value
                            max=1000000,  # Replace with dynamic max value
                            step=0.1,
                            marks={int(i): str(int(i)) for i in np.linspace(0, 1000000, num=10)},
                            value=[0, 1000000]
                        )
                    ], style={'marginTop': '1vw'}),  # Add spacing above the slider

                    html.Div([
                        html.Label("Select a CBU ZIP Code:"),
                        dcc.Dropdown(
                            id='cbu-zipcode-dropdown',
                            options=[{'label': 'Show All (Top 50)', 'value': 'all'}] +
                                    [{'label': zipcode, 'value': zipcode} for zipcode in cbu_zipcodes],
                            value='all',  # Default selection
                            placeholder="Choose a CBU ZIP Code",
                            style={'marginBottom': '1vw'}
                        )
                    ], style={'marginTop': '2vw'}),


                    html.Div(id='portfolio-section', children="No ZIP code selected.", style={
                        'marginTop': '1vw',
                        'padding': '10px',
                        'border': '1px solid #ccc',
                        'background-color': '#f8f9fa'
                    }),
                ])
            ], id="sidebar", style={
                'width': '15vw',
                'height': '100%',
                'position': 'absolute',
                'top': '0',
                'left': '-250px',
                'background-color': '#f8f9fa',
                'padding': '10px',
                'transition': '0.3s',
                'zIndex': '1',
                'overflow': 'auto'
            })
        ]),

        # Main content (Graph)
        html.Div([
            dcc.Graph(id='tsne-plot', style={'height': '75vh', 'width': '100%'})
        ], id='graph-container', style={'position': 'relative', 'paddingLeft': '10px'})
    ])
])

city_images_df = pd.read_csv('./src/assets/data/city_images.csv')

# Merge city and zipcode demographic data
merged_data = pd.merge(
    census_data,
    enrollment_data[['Mailing Zip/Postal Code', 'Mailing City', 'Mailing State/Province']],
    left_on='Zip_Code',
    right_on='Mailing Zip/Postal Code',
    how='left'
).drop_duplicates(subset=['Zip_Code'])

# Filter CA zips
california_data = merged_data[merged_data['Mailing State/Province'] == 'CA']


@app.callback(
    Output('portfolio-section', 'children'),
    [Input('tsne-plot', 'clickData'),
     Input('cbu-zipcode-dropdown', 'value')]  # Capture selected CBU ZIP
)
def update_portfolio(click_data, selected_cbu_zip):
    if not click_data:
        return "No ZIP code selected."

    selected_zip = click_data['points'][0]['text']
    filtered_data = california_data[california_data['Zip_Code'] == selected_zip]

    if filtered_data.empty:
        return "No data available for the selected ZIP code."

    zip_profile = filtered_data.iloc[0]

    if 'Mailing City' not in zip_profile or pd.isna(zip_profile['Mailing City']):
        return "City data not available for the selected ZIP code."

    city_name = zip_profile['Mailing City']
    city_population = california_data[california_data['Mailing City'] == city_name]['Population'].sum()

    # Retrieve city image URL
    city_image_row = city_images_df[city_images_df['City'].str.lower() == city_name.lower()]
    image_url = city_image_row['Image_URL'].values[0] if not city_image_row.empty else None

    # Initialize `closest_cbu_zip`
    closest_cbu_zip = None
    closest_cbu_data = None

    # ✅ **Force selected CBU ZIP if one is chosen**
    if selected_cbu_zip != "all" and selected_cbu_zip in cbu_zipcodes:
        closest_cbu_zip = selected_cbu_zip
        closest_cbu_data = cbu_census_data[cbu_census_data['Zip_Code'] == closest_cbu_zip]

    else:
        # 🔍 **Find the closest CBU ZIP dynamically if none is selected**
        selected_zip_data = non_cbu_census_data[non_cbu_census_data['Zip_Code'] == selected_zip]
        if not selected_zip_data.empty:
            try:
                closest_idx = np.argmin(euclidean_distances(
                    selected_zip_data[features], cbu_census_data[features]
                ))
                closest_cbu_zip = cbu_census_data.iloc[closest_idx]['Zip_Code']
                closest_cbu_data = cbu_census_data[cbu_census_data['Zip_Code'] == closest_cbu_zip]
            except ValueError:
                closest_cbu_zip = None
                closest_cbu_data = None

    # Construct Portfolio Content
    portfolio_content = [
        html.H3(f"Profile for ZIP Code: {zip_profile['Zip_Code']}"),
    ]

    if image_url:
        portfolio_content.append(html.Img(src=image_url, style={'width': '100%', 'height': 'auto', 'marginBottom': '10px'}))

    portfolio_content.extend([
        html.P(f"City: {city_name}"),
        html.P(f"State: California (CA)"),
        html.P(f"City Population: {city_population:,}"),
        html.P(f"ZIP Code Population: {zip_profile['Population']:,}"),
        html.P(f"Median Income: ${zip_profile['Median_Income']:,}"),
        html.P(f"Median Age: {zip_profile['Median_Age']} years"),
        html.P(f"Educational Attainment:"),
        html.Ul([
            html.Li(f"Bachelor's Degree: {zip_profile['Bachelor_Degree']*100:.1f}%"),
            html.Li(f"Graduate/Professional Degree: {zip_profile['Graduate_Professional_Degree']*100:.1f}%"),
        ]),
        html.P(f"Ethnic Composition:"),
        html.Ul([
            html.Li(f"White Alone: {zip_profile['White_Alone']*100:.1f}%"),
            html.Li(f"Black Alone: {zip_profile['Black_Alone']*100:.1f}%"),
            html.Li(f"Hispanic or Latino: {zip_profile['Hispanic_Latino']*100:.1f}%"),
        ]),
        html.P(f"Median Home Value: ${zip_profile['Median_Home_Value']:,}"),
        html.P(f"Median Gross Rent: ${zip_profile['Median_Gross_Rent']:,}"),
    ])

    # ✅ **Only generate LLM summary if a valid CBU ZIP is found**
    if closest_cbu_zip:
        llm_summary = generate_similarity_explanation(
            closest_cbu_zip, selected_zip, closest_cbu_data.iloc[0], zip_profile
        )

        portfolio_content.append(html.H4(f"Comparison between {closest_cbu_zip}"))
        portfolio_content.append(html.P(f"{llm_summary}"))

    return portfolio_content




# Callback to update the slider range based on dropdown value
@app.callback(
    [Output('feature-slider', 'min'),
     Output('feature-slider', 'max'),
     Output('feature-slider', 'value'),
     Output('feature-slider', 'marks'),
     Output('slider-label', 'children')],
    [Input('feature-dropdown', 'value')]
)
def update_slider(selected_feature):
    # Fields that are percentage-based
    percentage_fields = ['Bachelor_Degree', 'Unemployment']

    # Format values in thousands for these fields
    fields_in_thousands = ['Population', 'Median_Income', 'Median_Home_Value']

    if selected_feature in percentage_fields:
        # Set range for percentage fields (0 to 1)
        min_val, max_val = 0, 1
        value = [min_val, max_val]
        marks = {i / 10: f"{int(i * 10)}" for i in range(0, 11)}  # Marks from 0% to 100%
        label = f"{selected_feature.replace('_', ' ')} Percentage %:"
    else:
        # Use min and max values for non-percentage fields
        min_val = census_data[selected_feature].min()
        max_val = census_data[selected_feature].max()
        value = [min_val, max_val]

        # Format marks for fields in thousands
        if selected_feature in fields_in_thousands:
            marks = {int(i): f"{int(i/1000)}" for i in np.linspace(min_val, max_val, num=10)}
        else:
            marks = {int(i): str(int(i)) for i in np.linspace(min_val, max_val, num=10)}

        label = f" {selected_feature.replace('_', ' ')} (in thousands):"

    return min_val, max_val, value, marks, label



@app.callback(
    Output('tsne-plot', 'figure'),
    [
        Input('dimension-dropdown', 'value'),
        Input('feature-dropdown', 'value'),
        Input('feature-slider', 'value'),
        Input('cbu-zipcode-dropdown', 'value')
    ]
)
def update_graph(selected_dimension, selected_feature, feature_range, selected_cbu_zip):
    # Default axis titles for Generalized (combined t-SNE components)
    xaxis_title, yaxis_title = 't-SNE Component 1', 't-SNE Component 2'
    x_data, y_data = combined_coords[:, 0], combined_coords[:, 1]

    # Update axis titles and data based on selected dimension
    if selected_dimension == 'economic_prosperity':
        xaxis_title = 'Median Income'
        yaxis_title = 'Median Home Value'
        x_data = census_data['Median_Income']
        y_data = census_data['Median_Home_Value']
    elif selected_dimension == 'educational_attainment':
        xaxis_title = 'Percentage with Bachelor’s Degree'
        yaxis_title = 'Percentage with Graduate/Professional Degree'
        x_data = census_data['Bachelor_Degree']
        y_data = census_data['Graduate_Professional_Degree']
    elif selected_dimension == 'population_density':
        xaxis_title = 'Population'
        yaxis_title = 'Unemployment Rate'
        x_data = census_data['Population']
        y_data = census_data['Unemployment']
    elif selected_dimension == 'ethnic_diversity':
        xaxis_title = 'Percentage Hispanic or Latino'
        yaxis_title = 'Percentage Black or African American'
        x_data = census_data['Hispanic_Latino']
        y_data = census_data['Black_Alone']

    # Handle default view if "Show All (Top 50)" is selected
    if selected_cbu_zip == 'all':
        # Filter data based on selected feature and slider range
        filtered_cbu_data = cbu_census_data[
            (cbu_census_data[selected_feature] >= feature_range[0]) &
            (cbu_census_data[selected_feature] <= feature_range[1])
        ]
        filtered_non_cbu_data = top_100_non_cbu_census_data[
            (top_100_non_cbu_census_data[selected_feature] >= feature_range[0]) &
            (top_100_non_cbu_census_data[selected_feature] <= feature_range[1])
        ]

        # Limit non-CBU nodes to 50
        filtered_non_cbu_data = filtered_non_cbu_data.head(50)

        # Generate hover info for the filtered data
        cbu_hover_info = generate_hover_info(filtered_cbu_data)
        non_cbu_hover_info = generate_hover_info(filtered_non_cbu_data)

        trace_cbu = go.Scatter(
            x=x_data[:len(filtered_cbu_data)],
            y=y_data[:len(filtered_cbu_data)],
            mode='markers+text',
            marker=dict(size=10, color='rgb(0, 213, 240)', opacity=0.8),
            text=filtered_cbu_data['Zip_Code'],
            hoverinfo='text',
            hovertext=cbu_hover_info,
            name='CBU'
        )

        trace_non_cbu = go.Scatter(
            x=x_data[len(filtered_cbu_data):len(filtered_cbu_data) + len(filtered_non_cbu_data)],
            y=y_data[len(filtered_cbu_data):len(filtered_cbu_data) + len(filtered_non_cbu_data)],
            mode='markers+text',
            marker=dict(size=10, color='rgb(235,216,1)', opacity=0.8),

            text=filtered_non_cbu_data['Zip_Code'],
            hoverinfo='text',
            hovertext=non_cbu_hover_info,
            name='Non-CBU'
        )

        layout = go.Layout(
            xaxis=dict(title=xaxis_title),
            yaxis=dict(title=yaxis_title),
            margin=dict(l=0, r=0, b=0, t=0),
            autosize=True,
            showlegend=True
        )

        return go.Figure(data=[trace_cbu, trace_non_cbu], layout=layout)

    # Handle specific CBU ZIP code selection
    if selected_cbu_zip:
        # Filter the selected CBU ZIP code data
        selected_cbu_data = cbu_census_data[cbu_census_data['Zip_Code'] == selected_cbu_zip]
        if not selected_cbu_data.empty:
            selected_cbu_scaled = scaler.transform(selected_cbu_data[features])
            distances_to_non_cbu = euclidean_distances(non_cbu_census_data_scaled, selected_cbu_scaled)
            top_10_indices = np.argsort(distances_to_non_cbu.flatten())[:5]  # Changed to top 10
            top_10_non_cbu_data = non_cbu_census_data.iloc[top_10_indices]

            # Apply feature-based filtering to the selected top 10 ZIP codes
            top_10_non_cbu_data = top_10_non_cbu_data[
                (top_10_non_cbu_data[selected_feature] >= feature_range[0]) &
                (top_10_non_cbu_data[selected_feature] <= feature_range[1])
            ]

            # Combine the selected ZIP code and its filtered top 10 similar ZIP codes
            subset_data = pd.concat([selected_cbu_data, top_10_non_cbu_data])

            # Dynamically recalculate t-SNE coordinates for the subset
            subset_scaled = scaler.transform(subset_data[features])
            n_samples = len(subset_scaled)
            perplexity = min(5, max(1, n_samples // 3))  # Ensure perplexity < n_samples and > 0
            tsne_subset = TSNE(n_components=2, random_state=42, perplexity=perplexity, learning_rate=100, init='random')
            subset_coords = tsne_subset.fit_transform(subset_scaled)

            cbu_coords = subset_coords[:1]  # First row is the selected ZIP code
            non_cbu_coords = subset_coords[1:]  # Remaining rows are the filtered top 10 non-CBU ZIP codes

            cbu_hover_info = generate_hover_info(selected_cbu_data)
            non_cbu_hover_info = generate_hover_info(top_10_non_cbu_data)

            trace_cbu = go.Scatter(
                x=cbu_coords[:, 0],
                y=cbu_coords[:, 1],
                mode='markers+text',
                marker=dict(size=15, color='blue', opacity=0.9),
                text=selected_cbu_data['Zip_Code'],
                hoverinfo='text',
                hovertext=cbu_hover_info,
                name=f'Selected ZIP: {selected_cbu_zip}'
            )

            trace_non_cbu = go.Scatter(
                x=non_cbu_coords[:, 0],
                y=non_cbu_coords[:, 1],
                mode='markers+text',
                marker=dict(size=12, color='red', opacity=0.8),
                text=top_10_non_cbu_data['Zip_Code'],
                hoverinfo='text',
                hovertext=non_cbu_hover_info,
                name=f'Top 10 Similar to {selected_cbu_zip}'
            )

            layout = go.Layout(
                xaxis=dict(title=xaxis_title),
                yaxis=dict(title=yaxis_title),
                margin=dict(l=0, r=0, b=0, t=0),
                autosize=True,
                showlegend=True
            )

            return go.Figure(data=[trace_cbu, trace_non_cbu], layout=layout)

    # Default fallback (if none of the above applies)
    return dash.no_update







# Sidebar toggle callback
@app.callback(
    [Output("sidebar", "style"),
     Output("graph-container", "style")],
    [Input("toggle-button", "n_clicks")],
    [State("sidebar", "style"), State("graph-container", "style")]
)
def toggle_sidebar(n_clicks, sidebar_style, graph_style):
    if n_clicks % 2 == 1:
        # Show sidebar and move graph to the right
        sidebar_style["left"] = "0vw"
        graph_style["paddingLeft"] = "0vw"  # Move graph to the right when sidebar is open
        graph_style["paddingTop"] = "2.5vw"  # Add paddingTop when sidebar is open
        sidebar_style["display"] = "block"  # Show the graph


    else:
        # Hide sidebar and reset graph position
        # sidebar_style["left"] = "-17vw"
        graph_style["paddingLeft"] = "0vw"  # Reset padding when sidebar is closed
        graph_style["paddingTop"] = "2.5vw"  # Add paddingTop when sidebar is open
        sidebar_style["display"] = "none"  # Hide the graph


    return sidebar_style, graph_style

# Run Dash app
if __name__ == '__main__':
    app.run_server(debug=True)
