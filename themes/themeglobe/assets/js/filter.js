const pageId = document.querySelector('body').id
let sortOrder = null

const mixer = mixitup('#grids-homepage', {
  multifilter: {
    enable: true,
    logicWithinGroup: 'or',
    logicBetweenGroups: 'and'
  },
  animation: {
    enable: false,
  },
  selectors: {
    target: '.grid-item'
  },
  load: {
    sort: sortOrder
  },
  callbacks: {
    onMixStart: function(state, futureState) {
      let total = futureState.totalShow;
      let count = document.querySelector('.count-number');
      count.textContent = total;
      window.scrollTo(0, 0);
      updateFilterCounts(state, futureState);
    },
    onMixClick: function(state, originalEvent) {},
    onParseFilterGroups: handleParseFilterGroups,
    onMixEnd: setHash
  }
});

const providerGroup = ["athemes", "cssigniter", "gavick", "graphpaperpress", "elegantthemes", "joomdev", "joomforest", "joomjunk", "joomla51", "joomlabamboo", "joomlart", "joomlashine", "joomshaper", "rockettheme", "shape5", "studiopress", "teslathemes", "themeforest", "themeum", "themify", "wpzoom", "yootheme", "youjoomla"]

const themeFrameworkGroup = ["gantry", "gavern", "helix", "standalone", "sun", "t4", "vertex", "wright"]
const pricingGroup = ["free", "paid"]

const groups = {
  provider: providerGroup,
  tags: tagsGroup,
  themeFramework: themeFrameworkGroup,
  pricing: pricingGroup
}

function getTriggerGroup(event) {
  triggerGroup = null;
  if (!event) {
    return triggerGroup
  } else if (event.classList.contains('filter-button')) {
    triggerGroup = event.parentNode.parentNode.parentNode.id.slice(13);
  };
  return triggerGroup;
}

function updateFilterCounts(state, futureState) {

  let triggerGroup = getTriggerGroup(futureState.triggerElement)
  let totalMatching = futureState.targets.map(theme => theme.className.trim().split(" "));
  let matching = futureState.matching.map(theme => theme.className.trim().split(" "));

  let hasMultipleActiveGroups = checkActiveGroups();

  // Update Filter Counts 
  Object.keys(groups).forEach((group) => {
    if (hasMultipleActiveGroups) {
      resetCount(groups[group], totalMatching);
      updateCount(groups[group], matching);
    } else {
      if (group === triggerGroup) {
        resetCount(groups[group], totalMatching);
      } else if (!triggerGroup) {

      } else {
        updateCount(groups[group], matching);
      }
    }
  })
}

function checkActiveGroups() {
  let activeGroups = Object.keys(groups).map(group => {
    return mixer.getFilterGroupSelectors(group)
  })

  let activeGroupsLength = 0
  activeGroups.forEach(group => {
    if (group.length) {
      activeGroupsLength += 1
    }
  })
  return activeGroupsLength >= 2;
}

function updateCount(group, matches) {

  group.forEach(term => {
    let count = matches.filter(match => {
      return match.includes(term);
    })
    document.querySelector(`#filter-count-${term}`).innerText = count.length
    document.querySelector(`#filter-button-${term}`).setAttribute('data-count', count.length)
  })
}

function resetCount(group, matches) {
  group.forEach(term => {
    let count = matches.filter(match => {
      return match.includes(term);
    })
    document.querySelector(`#filter-count-${term}`).innerText = count.length
    document.querySelector(`#filter-button-${term}`).setAttribute('data-count', count.length)
  })
}

var uiState = deserializeHash();

if (uiState) {
  // If a valid uiState object is present on page load, filter the mixer
  syncMixerWithPreviousUiState(uiState);
}
