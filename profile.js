const jwt = localStorage.getItem('jwt');
if (!jwt) {
  window.location.href = 'index.html';
}

// Particles.js initialization
particlesJS('particles-js', {
  particles: {
    number: { value: 100 },
    color: { value: '#3b82f6' },
    shape: { type: 'circle' },
    opacity: { value: 0.6 },
    size: { value: 3.5 },
    move: {
      enable: true,
      speed: 1.2,
      direction: 'none',
      random: true,
      out_mode: 'out',
    },
  },
  interactivity: {
    events: {
      onhover: { enable: true, mode: 'bubble' },
      onclick: { enable: true, mode: 'push' },
    },
    modes: {
      bubble: { distance: 200, size: 6, duration: 0.4 },
      push: { particles_nb: 4 },
    },
  },
  retina_detect: true,
});

const fetchProfileData = async () => {
  const getEventIdQuery = `
    query GetEventId {
      events: progress(
        order_by: [{objectId: asc}, {createdAt: desc}]
        distinct_on: [objectId]
        where: {object: {name: {_eq: "Module"}}}
        limit: 1
      ) {
        eventId
      }
    }
  `;

  const getProfileQuery = `
    query GetProfileData($eventId: Int!) {
      user {
          id
          auditRatio
          campus
          createdAt
          email
          firstName
          lastName
          login
          totalUp
          totalDown
          labels {
            labelName
          }
      }
      xp: transaction_aggregate(where: {type: {_eq: "xp"}, eventId: {_eq: $eventId}}) {
        aggregate {
          sum {
            amount
          }
        }
      }
      progress: transaction(
        where: {type: {_eq: "xp"}, eventId: {_eq: 20}}
        order_by: {createdAt: asc}
      ) {
        amount
        createdAt
        object {
          name
          type
          attrs
        }
      }
      level: transaction(
        limit: 1
        order_by: {amount: desc}
        where: {type: {_eq: "level"}}
      ) {
        amount
      }
      skills: transaction(
        where: {type: {_like:"skill_%"}}
        distinct_on:[type]
      ) {
        type
      }
    }
  `;

  const fetchGraphQL = async (query, variables = {}) => {
    const response = await fetch(
      'https://learn.reboot01.com/api/graphql-engine/v1/graphql',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      }
    );
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const json = await response.json();
    if (json.errors) {
      throw new Error(json.errors[0].message);
    }
    
    return json.data;
  };

  try {
    // Get the module eventId first
    const eventData = await fetchGraphQL(getEventIdQuery);
    const eventId = eventData.events?.[0]?.eventId;
    if (!eventId) {
      throw new Error('No module event found');
    }

    // Then fetch profile data with the eventId
    const profileData = await fetchGraphQL(getProfileQuery, { eventId });
    displayProfile(profileData);
  } catch (error) {
    alert(error.message || 'Failed to fetch profile data');
    console.error('Profile data fetch error:', error);
  }
};

const formatNumber = (num) => {
  if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + ' MB';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + ' kB';
  } else {
    return num;
  }
};

const formatNumber2 = (num) => {
  if (num >= 1e6) {
    return Math.round(num / 1e6) + ' MB';
  } else if (num >= 1e3) {
    return Math.round(num / 1e3) + ' kB';
  } else {
    return num;
  }
};

const displayProfile = (data) => {
  const user = data.user[0];
  const level = data.level[0].amount;
  const xp = data.xp.aggregate.sum.amount;

  // Update Level Badge
  const levelBadge = document.getElementById('level-badge');
  levelBadge.innerHTML = `
      <span class="text-md text-white">Level ${level}</span>
    `;

  // Update Profile Info
  document.getElementById(
    'user-name'
  ).textContent = `${user.firstName} ${user.lastName}`;
  document.getElementById('user-handle').textContent = `@${user.login}`;

  // Update Cohort Info
  const cohortInfo = document.getElementById('cohort-info');
  cohortInfo.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="text-blue-200">Campus:</span>
        <span class="font-medium">${user.campus.toUpperCase()}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-blue-200">Member Since:</span>
        <span class="font-medium">${new Date(
          user.createdAt
        ).toLocaleDateString()}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-blue-200">Cohort:</span>
        <span class="font-medium">${
          user.labels && user.labels[0].labelName
            ? user.labels[0].labelName.replace('Cohort ', '')
            : ''
        }</span>
      </div>
    `;

  // Update Progress Bars
  const total = user.totalUp + user.totalDown;
  const doneProgress = document.getElementById('audit-ratio-done');
  const receivedProgress = document.getElementById('audit-ratio-received');

  doneProgress.style.width = `${(user.totalUp / total) * 100}%`;
  receivedProgress.style.width = `${(user.totalDown / total) * 100}%`;

  // Update progress labels
  document.getElementById(
    'audit-ratio-done-text'
  ).textContent = `Audits Done (${((user.totalUp / total) * 100).toFixed(2)}%)`;
  document.getElementById(
    'audit-ratio-received-text'
  ).textContent = `Audits Received (${((user.totalDown / total) * 100).toFixed(
    2
  )}%)`;

  document.getElementById('audit-ratio-done-number').textContent = formatNumber(
    user.totalUp
  );
  document.getElementById('audit-ratio-received-number').textContent =
    formatNumber(user.totalDown);

  // Update core stats
  const coreStats = document.getElementById('coreStats');
  coreStats.innerHTML = `
      <div class="stat-item">
        <div class="text-2xl font-bold text-blue-200">${formatNumber2(xp)}</div>
        <div class="text-sm text-white/80">Total XP</div>
      </div>
      <div class="stat-item">
        <div class="text-2xl font-bold text-blue-400">${parseFloat(
          user.auditRatio
        ).toFixed(2)}</div>
        <div class="text-sm text-white/80">Audit Ratio</div>
      </div>
    `;

  // Update skills
  const skillsContainer = document.getElementById('skills');
  skillsContainer.innerHTML = data.skills
    .map((skill) => {
      const skillType = skill.type.replace('skill_', '');
      return `<span class="skill-badge">${skillType}</span>`;
    })
    .join(' ');

  // Initialize chart and projects map
  createXpByProjectGraph(data.progress);

  // Logout handler
  document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('jwt');
    window.location.href = 'index.html';
  });
};

const createXpByProjectGraph = (projects) => {
  // Clear any existing chart first to prevent duplicates
  const parentElement = document.getElementById('xp-progress').parentElement;
  parentElement.style.width = '100%'; // Make container responsive
  parentElement.style.maxWidth = '100%'; // Ensure container doesn't overflow
  parentElement.style.position = 'relative'; // For proper sizing
  parentElement.style.display = 'block'; // Ensure block display

  let cumulativeXP = 0;
  const cumulativeData1 = projects.map((project) => {
    cumulativeXP += project.amount;
    return {
      ...project,
      cumulativeXP,
    };
  });

  const cumulativeData = cumulativeData1.filter((d) => d.object.type === 'project');

  // Get container dimensions
  const container = document.getElementById('xp-progress').parentElement;
  const width = container.clientWidth;
  const height = Math.min(400, Math.max(250, width * 0.4)); // Responsive height with limits

  // Set up responsive SVG with viewBox for better scaling
  const svg = d3.select('#xp-progress')
    .attr('width', '100%')
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('overflow', 'hidden'); // Prevent overflow
  
  svg.selectAll('*').remove();

  // Set up dimensions with dynamic margins that scale with container size
  const margin = {
    top: Math.max(20, height * 0.08),
    right: Math.max(20, width * 0.05),
    bottom: Math.max(50, height * 0.15), // Larger bottom margin for rotated labels
    left: Math.max(50, width * 0.1)
  };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create scales with padded domains
  const timeExtent = d3.extent(cumulativeData, d => new Date(d.createdAt));
  const timePadding = (timeExtent[1] - timeExtent[0]) * 0.05;
  
  const x = d3
    .scaleTime()
    .domain([
      new Date(timeExtent[0] - timePadding),
      new Date(timeExtent[1].getTime() + timePadding)
    ])
    .range([0, innerWidth]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(cumulativeData, (d) => d.cumulativeXP) * 1.05])
    .range([innerHeight, 0]);

  // Create container group
  const g = svg
    .append('g')
    .attr('class', 'chart-group')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Add grid lines with theme color
  g.append('g')
    .attr('class', 'grid')
    .selectAll('line')
    .data(y.ticks(5))
    .enter()
    .append('line')
    .attr('class', 'grid-line')
    .attr('x1', 0)
    .attr('x2', innerWidth)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d))
    .style('stroke', 'rgba(59, 130, 246, 0.15)') // Theme blue with low opacity
    .style('stroke-dasharray', '2,2');

  // Create gradient for the line
  const gradientId = 'lineGradient-' + Date.now(); // Unique ID to prevent conflicts
  const gradient = svg
    .append('defs')
    .append('linearGradient')
    .attr('id', gradientId)
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%');

  gradient
    .append('stop')
    .attr('offset', '0%')
    .style('stop-color', '#3b82f6');

  gradient
    .append('stop')
    .attr('offset', '100%')
    .style('stop-color', '#c62368');

  // Create the step line generator
  const line = d3
    .line()
    .x((d) => x(new Date(d.createdAt)))
    .y((d) => y(d.cumulativeXP))
    .curve(d3.curveStepAfter);

  // Add the step line path with enhanced styling
  g.append('path')
    .attr('class', 'line')
    .datum(cumulativeData)
    .attr('d', line)
    .style('fill', 'none')
    .style('stroke', `url(#${gradientId})`)
    .style('stroke-width', Math.min(3, width * 0.005)) // Responsive stroke width
    .style('stroke-linejoin', 'round')
    .style('filter', 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.3))');

  // Calculate responsive dot size
  const dotRadius = Math.min(5, Math.max(3, width * 0.008));

  // Add dots with improved styling
  const dots = g
    .selectAll('.dot')
    .data(cumulativeData)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', (d) => x(new Date(d.createdAt)))
    .attr('cy', (d) => y(d.cumulativeXP))
    .attr('r', dotRadius)
    .style('fill', '#3b82f6')
    .style('stroke', '#fff')
    .style('stroke-width', Math.min(2, width * 0.003))
    .style('filter', 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))');

  // Enhanced tooltip with responsive positioning
  const tooltip = d3
    .select('body')
    .append('div')
    .attr('class', 'chart-tooltip')
    .style('position', 'absolute')
    .style('padding', '12px')
    .style('background', 'rgba(59, 130, 246, 0.1)')
    .style('backdrop-filter', 'blur(10px)')
    .style('border', '1px solid rgba(59, 130, 246, 0.2)')
    .style('border-radius', '8px')
    .style('color', 'white')
    .style('font-size', `${Math.min(12, Math.max(10, width * 0.02))}px`)
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('z-index', '1000')
    .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)');

  // Enhanced interactions
  dots
    .on('mouseover', (event, d) => {
      const dotElement = d3.select(event.currentTarget);
      dotElement
        .transition()
        .duration(200)
        .attr('r', dotRadius * 1.5)
        .style('fill', '#c62368')
        .style('filter', 'drop-shadow(0 0 6px rgba(198, 35, 104, 0.5))');

      tooltip.transition().duration(200).style('opacity', 1);

      // Calculate tooltip position
      const tooltipWidth = 200; // Approximate width
      const tooltipHeight = 120; // Approximate height
      let tooltipX = event.pageX + 10;
      let tooltipY = event.pageY - 28;

      // Adjust if tooltip would go off screen
      if (tooltipX + tooltipWidth > window.innerWidth) {
        tooltipX = event.pageX - tooltipWidth - 10;
      }
      if (tooltipY + tooltipHeight > window.innerHeight) {
        tooltipY = event.pageY - tooltipHeight - 10;
      }

      tooltip
        .html(
          `
          <div style="font-weight: 600; color: #3b82f6; margin-bottom: 4px;">${d.object.name}</div>
          <div style="margin: 2px 0;">Project XP: +${formatNumber(d.amount)}</div>
          <div style="margin: 2px 0;">Total XP: ${formatNumber(d.cumulativeXP)}</div>
          <div style="margin: 2px 0;">Completed: ${new Date(d.createdAt).toLocaleDateString()}</div>
          ${
            d.object.attrs?.language
              ? `<div style="margin-top: 4px; color: #c62368;">${d.object.attrs.language}</div>`
              : ''
          }
        `
        )
        .style('left', `${tooltipX}px`)
        .style('top', `${tooltipY}px`);
    })
    .on('mouseout', (event) => {
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr('r', dotRadius)
        .style('fill', '#3b82f6')
        .style('filter', 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))');

      tooltip.transition().duration(500).style('opacity', 0);
    });

  // Add and style axes with responsive font sizes
  const fontSize = Math.min(10, Math.max(8, width * 0.02));
  
  const xAxis = d3.axisBottom(x)
    .ticks(width < 600 ? 4 : 6)
    .tickFormat(d => d.toLocaleDateString());

  const yAxis = d3.axisLeft(y)
    .ticks(5)
    .tickFormat(formatNumber2);

  // Add x-axis with enhanced styling
  const xAxisG = g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(xAxis);

  xAxisG.selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(-45)')
    .style('fill', 'rgba(255, 255, 255, 0.8)')
    .style('font-size', `${fontSize}px`);

  // Add y-axis with enhanced styling
  const yAxisG = g.append('g')
    .attr('class', 'y-axis')
    .call(yAxis);

  yAxisG.selectAll('text')
    .style('fill', 'rgba(255, 255, 255, 0.8)')
    .style('font-size', `${fontSize}px`);

  // Style axis lines
  g.selectAll('.domain, .tick line')
    .style('stroke', 'rgba(59, 130, 246, 0.2)')
    .style('stroke-width', Math.min(1, width * 0.001));

  // Function to update chart on resize
  const updateChart = () => {
    // Get new container dimensions
    const newWidth = container.clientWidth;
    const newHeight = Math.min(400, Math.max(250, newWidth * 0.4));

    // Update SVG dimensions and viewBox
    svg
      .attr('height', newHeight)
      .attr('viewBox', `0 0 ${newWidth} ${newHeight}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Update margins
    margin.top = Math.max(20, newHeight * 0.08);
    margin.right = Math.max(20, newWidth * 0.05);
    margin.bottom = Math.max(50, newHeight * 0.15);
    margin.left = Math.max(50, newWidth * 0.1);

    const newInnerWidth = newWidth - margin.left - margin.right;
    const newInnerHeight = newHeight - margin.top - margin.bottom;

    // Update scales
    x.range([0, newInnerWidth]);
    y.range([newInnerHeight, 0]);

    // Update all elements
    g.attr('transform', `translate(${margin.left},${margin.top})`);
    g.select('.line').attr('d', line);
    g.selectAll('.dot')
      .attr('cx', d => x(new Date(d.createdAt)))
      .attr('cy', d => y(d.cumulativeXP))
      .attr('r', Math.min(5, Math.max(3, newWidth * 0.008)));
    
    g.selectAll('.grid-line')
      .attr('x2', newInnerWidth)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d));

    // Update axes
    const newFontSize = Math.min(10, Math.max(8, newWidth * 0.02));
    
    g.select('.x-axis')
      .attr('transform', `translate(0,${newInnerHeight})`)
      .call(xAxis.ticks(newWidth < 600 ? 4 : 6))
      .selectAll('text')
      .style('font-size', `${newFontSize}px`);

    g.select('.y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', `${newFontSize}px`);
  };

  // Debounced resize handler
  let resizeTimeout;
  const debouncedResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateChart, 250);
  };

  // Add resize listener
  window.addEventListener('resize', debouncedResize);

  // Cleanup function
  return () => {
    window.removeEventListener('resize', debouncedResize);
    clearTimeout(resizeTimeout);
  };
};

document.addEventListener('DOMContentLoaded', () => {
  fetchProfileData();
});
