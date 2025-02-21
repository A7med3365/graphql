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
        where: {type: {_eq: "xp"}, eventId: {_eq: $eventId}}
        order_by: {createdAt: asc}
      ) {
        amount
        object {
          name
          type
          createdAt
        }
        type
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
      projects: transaction(
          where: {
            type: {_eq: "xp"},
            object: {type: {_eq: "project"}}
          },
          order_by: {createdAt: asc}
        ) {
          amount
          createdAt
          object {
            name
            attrs
          }
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
  createXpByProjectGraph(data.projects);
  renderProjectsMap(data.projects);

  // Logout handler
  document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('jwt');
    window.location.href = 'index.html';
  });
};

const createXpByProjectGraph = (projects) => {
  // Sort projects by creation date and calculate cumulative XP
  const sortedProjects = [...projects].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  let cumulativeXP = 0;
  const cumulativeData = sortedProjects.map((project) => {
    cumulativeXP += project.amount;
    return {
      ...project,
      cumulativeXP,
    };
  });

  // Get container dimensions
  const container = document.getElementById('xp-progress').parentElement;
  const width = container.clientWidth;
  const height = Math.min(400, Math.max(250, width * 0.4)); // Responsive height with limits

  // Set up responsive SVG
  const svg = d3.select('#xp-progress')
    .attr('width', width)
    .attr('height', height)
    .style('overflow', 'visible'); // Allow labels to overflow
  
  svg.selectAll('*').remove();

  // Set up dimensions with adjusted margins
  const margin = { top: 30, right: 30, bottom: 60, left: 70 };
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
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Add grid lines with theme color
  g.append('g')
    .attr('class', 'grid')
    .selectAll('line')
    .data(y.ticks(5))
    .enter()
    .append('line')
    .attr('x1', 0)
    .attr('x2', innerWidth)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d))
    .style('stroke', 'rgba(59, 130, 246, 0.15)') // Theme blue with low opacity
    .style('stroke-dasharray', '2,2');

  // Create gradient for the line
  const gradient = svg
    .append('defs')
    .append('linearGradient')
    .attr('id', 'lineGradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%');

  gradient
    .append('stop')
    .attr('offset', '0%')
    .style('stop-color', '#3b82f6'); // Theme blue

  gradient
    .append('stop')
    .attr('offset', '100%')
    .style('stop-color', '#c62368'); // Theme pink

  // Create the step line generator
  const line = d3
    .line()
    .x((d) => x(new Date(d.createdAt)))
    .y((d) => y(d.cumulativeXP))
    .curve(d3.curveStepAfter);

  // Add the step line path with enhanced styling
  g.append('path')
    .datum(cumulativeData)
    .attr('class', 'line')
    .attr('d', line)
    .style('fill', 'none')
    .style('stroke', 'url(#lineGradient)')
    .style('stroke-width', 3)
    .style('stroke-linejoin', 'round')
    .style('filter', 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.3))');

  // Add dots with improved styling
  const dots = g
    .selectAll('.dot')
    .data(cumulativeData)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', (d) => x(new Date(d.createdAt)))
    .attr('cy', (d) => y(d.cumulativeXP))
    .attr('r', 5)
    .style('fill', '#3b82f6')
    .style('stroke', '#fff')
    .style('stroke-width', 2)
    .style('filter', 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))');

  // Enhanced tooltip
  const tooltip = d3
    .select('body')
    .append('div')
    .style('position', 'absolute')
    .style('padding', '12px')
    .style('background', 'rgba(59, 130, 246, 0.1)')
    .style('backdrop-filter', 'blur(10px)')
    .style('border', '1px solid rgba(59, 130, 246, 0.2)')
    .style('border-radius', '8px')
    .style('color', 'white')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)');

  // Enhanced interactions
  dots
    .on('mouseover', (event, d) => {
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr('r', 7)
        .style('fill', '#c62368')
        .style('filter', 'drop-shadow(0 0 6px rgba(198, 35, 104, 0.5))');

      tooltip.transition().duration(200).style('opacity', 1);
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
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 28}px`);
    })
    .on('mouseout', (event) => {
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr('r', 5)
        .style('fill', '#3b82f6')
        .style('filter', 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))');

      tooltip.transition().duration(500).style('opacity', 0);
    });

  // Add and style axes
  const xAxis = d3.axisBottom(x)
    .ticks(width < 600 ? 4 : 6)
    .tickFormat(d => d.toLocaleDateString());

  const yAxis = d3.axisLeft(y)
    .ticks(5)
    .tickFormat(formatNumber2);

  // Add x-axis with enhanced styling
  const xAxisG = g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(xAxis);

  xAxisG.selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(-45)')
    .style('fill', 'rgba(255, 255, 255, 0.8)')
    .style('font-size', '10px');

  // Add y-axis with enhanced styling
  const yAxisG = g.append('g')
    .call(yAxis);

  yAxisG.selectAll('text')
    .style('fill', 'rgba(255, 255, 255, 0.8)')
    .style('font-size', '10px');

  // Style axis lines
  g.selectAll('.domain')
    .style('stroke', 'rgba(59, 130, 246, 0.2)');

  g.selectAll('.tick line')
    .style('stroke', 'rgba(59, 130, 246, 0.2)');

  // Add resize handler
  const resize = () => {
    const newWidth = container.clientWidth;
    const newHeight = Math.min(400, Math.max(250, newWidth * 0.4));

    svg
      .attr('width', newWidth)
      .attr('height', newHeight);

    // Update scales and rerender
    x.range([0, newWidth - margin.left - margin.right]);
    y.range([newHeight - margin.top - margin.bottom, 0]);
  };

  // Add resize listener
  window.addEventListener('resize', resize);
};

const renderProjectsMap = (projects) => {
  const container = document.getElementById('projects-map');
  container.innerHTML = projects
    .map(
      (project) => `
      <div class="flex-shrink-0 w-48 p-4 bg-white/10 rounded-lg text-center hover:bg-white/20 transition-all">
        <h4 class="font-bold text-white mb-2">${project.object.name}</h4>
        <div class="text-purple-300 text-sm">
          +${formatNumber(project.amount)}
        </div>
        <div class="text-xs text-white/60 mt-2">
          ${new Date(project.createdAt).toLocaleDateString()}
        </div>
        <div class="mt-2">
          <span class="px-2 py-1 bg-[#c62368] rounded-full text-xs text-white">
            ${project.object.attrs.language}
          </span>
        </div>
      </div>
    `
    )
    .join('');
};

document.addEventListener('DOMContentLoaded', () => {
  fetchProfileData();
});
