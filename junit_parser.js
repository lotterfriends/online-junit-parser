(function(){

  function copyTextToClipboard(textArea) {
    textArea.focus();
    textArea.select();

    try {
      const success = document.execCommand('copy');
    } catch (err) {
      console.log('unable to copy');
    }
  }
  // to allow usage in onclick
  window.copyTextToClipboard = copyTextToClipboard;

  function parseTestcases(testcaseNodes) {
    return testcaseNodes.map(testcase => {
      const failure = testcase.querySelector('failure') ? testcase.querySelector('failure') : null;
      const skipped = testcase.querySelector('skipped') ? testcase.querySelector('skipped') : null;
      const error = testcase.querySelector('error') ? testcase.querySelector('error') : null;
      return {
        classname: testcase.getAttribute('classname'),
        name: testcase.getAttribute('name'),
        time: testcase.getAttribute('time') ? parseFloat(testcase.getAttribute('time'), 10) : null,
        skipped: skipped ? {
          message: skipped.getAttribute('message'),
        } : null,
        error: error && error.textContent ? error.textContent.trim() : '',
        failure: failure ? {
          message: failure.getAttribute('message'),
          type: failure.getAttribute('type'),
          content: failure.textContent ? failure.textContent.trim() : ''
        } : failure,
        systemOut: testcase.querySelector('system-out') ?  testcase.querySelector('system-out').textContent.trim() : '',
        systemErr: testcase.querySelector('system-err') ?  testcase.querySelector('system-err').textContent.trim() : '',
      };
    });
  }

  function parseTestsuite(testsuiteNodes) {
    return testsuiteNodes.map(testsuite => {
      const testcases = [...testsuite.querySelectorAll(':scope > testcase')];
      return {
        id: testsuite.getAttribute('id'),
        name: testsuite.getAttribute('name'),
        package: testsuite.getAttribute('package'),
        hostname: testsuite.getAttribute('hostname'),
        disabled: testsuite.getAttribute('disabled') ? parseInt(testsuite.getAttribute('disabled'), 10) : null,
        failures: testsuite.getAttribute('failures') ? parseInt(testsuite.getAttribute('failures'), 10) : null,
        errors: testsuite.getAttribute('errors') ? parseInt(testsuite.getAttribute('errors'), 10) : null,
        skipped: testsuite.getAttribute('skipped') ? parseInt(testsuite.getAttribute('skipped'), 10) : null,
        tests: testsuite.getAttribute('tests') ? parseInt(testsuite.getAttribute('tests'), 10) : null,
        time: testsuite.getAttribute('time') ? parseFloat(testsuite.getAttribute('time'), 10) : null,
        timestamp: testsuite.getAttribute('timestamp') ? new Date(testsuite.getAttribute('timestamp')) : null,
        testcases: testcases.length ? parseTestcases(testcases) : [],
      };
    });
  }

  function parseTestsuites(testsuitesNodes) {
    return testsuitesNodes.map(testsuites => {
      const testsuite = [...testsuites.querySelectorAll(':scope > testsuite')];
      return {
        name: testsuites.getAttribute('name'),
        tests: testsuites.getAttribute('tests') ? parseInt(testsuites.getAttribute('tests'), 10) : null,
        failures: testsuites.getAttribute('failures') ? parseInt(testsuites.getAttribute('failures'), 10) : null,
        errors: testsuites.getAttribute('errors') ? parseInt(testsuites.getAttribute('errors'), 10) : null,
        disabled: testsuites.getAttribute('disabled') ? parseInt(testsuites.getAttribute('disabled'), 10) : null,
        time: testsuites.getAttribute('time') ? parseFloat(testsuites.getAttribute('time')) : null,
        testsuite: testsuite.length ? parseTestsuite(testsuite) : [],
      };
    });
  }

  function convertToJson(xmlDoc) {
    const result = {
      testsuites: [],
    };
    const testsuitesNodes = [...xmlDoc.getElementsByTagName('testsuites')]
    if (testsuitesNodes && testsuitesNodes.length) {
      result.testsuites = parseTestsuites(testsuitesNodes);
    } else {
      const testsuiteNodes = [...xmlDoc.querySelectorAll('testsuite')];
      if (testsuiteNodes && testsuiteNodes.length) {
        result.testsuites = Array({
          testsuite: parseTestsuite(testsuiteNodes)
        });
      }
    }
    return result;
  }

  function tplHeader(testsuites) {
    return `${testsuites.name !== null ? `<h1>${testsuites.name}</h1>` : ''}
      <h2>
        ${testsuites.tests !== null ? `Tests: <b>${testsuites.tests}</b>,` : ''}
        ${testsuites.failures !== null ? `Failures: <b>${testsuites.failures}</b>,` : ''}
        ${testsuites.errors !== null ? `Errors: <b>${testsuites.errors}</b>,` : ''}
        ${testsuites.time ? `<em>Time: ${testsuites.time}</em>`: ''}
      </h2>`;
  }

  function tpl(result, clean) {
    return result.testsuites.map(testsuites =>
      `${testsuites.name ? tplHeader(testsuites) : ''}
      ${tplTestsuite(testsuites.testsuite, clean)}`
    ).join('');
  }

  function tplSuiteResult(testsuite) {
    const errorIsFailure = getSetting('ErrorIsFailure');;
    if ((testsuite.failures > 0)
      || (errorIsFailure && testsuite.errors && testsuite.errors > 0)) {
      return `<span style="color: red">⛔</span>`;
    }
    return `<span style="color: green">✅</span>`;
  }

  function tplTestsuite(testsuites, clean) {
    if (!testsuites || !testsuites.length) {
      return '';
    }
    return testsuites.map((testsuite, ts_i) =>
      `<details id="suite.${ts_i}">
        <summary ${clean ? '' : `onclick="updateUrl('suite.${ts_i}')"`}>
          ${tplSuiteResult(testsuite)}
          ${testsuite.name !== null ? ` <span class="testsuite-name" title="${testsuite.name}">${testsuite.name}</span>` : ''}
          ${testsuite.tests !== null ? `Tests: <b>${testsuite.tests}</b>,` : ''}
          ${testsuite.failures !== null ? `Failures: <b>${testsuite.failures}</b>,` : ''}
          ${testsuite.errors !== null ? `Errors: <b>${testsuite.errors}</b>,` : ''}
          ${testsuite.skipped !== null ? `Skipped: <b>${testsuite.skipped}</b>,` : ''}
          ${testsuite.time ? `<em>Time: ${testsuite.time}</em>`: ''}
        </summary>
        ${tplTestcases(ts_i, testsuite.testcases, clean)}
      </details>`
    ).join('');
  }

  function tplCaseResult(testcase, tstc_id, clean) {
    var o;
    if (testcase.failure) {
      o = {
        summary: `<span title="failed" style="color: red">⛔</span>`,
        details: `<div>
              ${testcase.failure.type ? `<div>${testcase.failure.type}</div>` : ''}
              ${testcase.failure.message ? `<div>${testcase.failure.message}</div>` : ''}
              ${testcase.failure.content && testcase.failure.content.length ?
                `<div><b>Content:</b></div>
                <div><pre>${testcase.failure.content}</pre></div>` : ''}
            </div>`
      };
    } else if (testcase.error) {
      const isF = getSetting('ErrorIsFailure');
      o = {
        summary: `<span title="errored" style="color: ${isF ? `red">⛔` : `green">✅`}</span>`,
        details: testcase.error.length ?
          `<div><pre>${testcase.error}</pre></div>` : ''
      };
    } else if (testcase.skipped) {
      o = {
        summary: `<span title="skipped">⏩</span>`,
        details: testcase.skipped.message ?
          `<div>${testcase.skipped.message}</div>` : ''
      };
    } else {
      o = {
        summary: `<span title="passed" style="color: green">✅</span>`,
        details: ''
      };
    }
    return `<details style="margin-left: 1em" id=${tstc_id}>
        <summary ${clean ? '': `onclick="updateUrl('${tstc_id}')"`}>
          ${o.summary}
          <span class="testcase-name" title=" ${testcase.name ? testcase.name : ''} ${testcase.classname ? testcase.classname : ''}">
            ${testcase.name ? testcase.name : ''}
            ${testcase.classname ? testcase.classname : ''}
          </span>
          <em>${testcase.time}</em>
        </summary>
        <div style="margin-left: 1em" >
          ${o.details}
          <div>
            ${testcase.systemOut && testcase.systemOut.length ? `
              <div><b>System-Out:</b></div>
              <div><pre>${testcase.systemOut}</pre></div>
            ` : ''}
            ${testcase.systemErr && testcase.systemErr.length ? `
              <div><b>System-Err:</b></div>
              <div><pre>${testcase.systemErr}</pre></div>
            ` : ''}
          </div>
        </div>
      </details>`;
  }

  function tplTestcases(ts_i, testcases, clean) {
    if (!testcases || !testcases.length) {
      return ''
    }
    return '<div>' + testcases.map((testcase, tc_i) =>
      `${tplCaseResult(testcase, `case.${ts_i}.${tc_i}`, clean)}`).join('')
      + '</div>';
  }

  function refresh(event) {
    const text = document.querySelector('textarea.xml').value;
    localStorage.setItem('xml', text);
    saveSettingInStorage('ErrorIsFailure');
    saveSettingInStorage('PlotResult');
    parseText(text);
  }

  function processFile(evt) {
    if (evt.target.files.length < 1) {
      console.log('invalid files length: ' + evt.target.files.length);
      return;
    }
    const fr = new FileReader();
    fr.onload = (ev) => {
      document.querySelector('textarea.xml').value = ev.target.result;
      refresh();
    };
    fr.readAsText(evt.target.files[0]);
  }

  function plotSvg(tss) {
    const line_colors = [
      '#00BFFF',  // DeepSkyBlue
      '#98FB98',  // PaleGreen
      '#FFFF00',  // Yellow
      '#FFA07A',  // LightSalmon
      '#F4A460',  // SandyBrown
      '#FFB6C1',  // LightPink
      '#ADD8E6',  // LightBlue
      '#DDA0DD',  // Plum
    ];

    function node(el, attrs) {
      const e = document.createElementNS("http://www.w3.org/2000/svg", el);
      for (var i in attrs) {
        e.setAttributeNS(null, i, attrs[i]);
      }
      return e;
    }

    function plotInit(plotDiv, suite_name) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg",
        'svg');
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      var n = node('rect', { width: '100%', height: '100%', fill: 'black' });
      svg.appendChild(n);  // background

      [ 'passed', 'skipped', 'failed' ].forEach((bucket, i) => {
        const rect_y = i * 100 + 96;  // dividers for pass, skip & fail buckets
        const tx_y = rect_y + 94;
        var g = node('g', {});
        n = node('title', {});
        n.appendChild(document.createTextNode(`${bucket} tests`));
        g.appendChild(n);
        n = node('rect', { x: '0', y: rect_y, width: '100%', height: '102',
            'stroke-dasharray': '4', stroke: 'grey', 'stroke-width': '2' });
        g.appendChild(n);
        n = node('text', { x: '99%', y: tx_y, 'font-size': '12', fill: 'grey',
          'text-anchor': 'end'});
        n.appendChild(document.createTextNode(bucket));
        g.appendChild(n);
        svg.appendChild(g);
      });

      n = node('text', { x: '50%', y: '28', 'text-anchor': 'middle',
        'font-size': '28', fill: 'white' });
      svg.appendChild(n);
      n.appendChild(
        document.createTextNode(`Results for Test Suite ${suite_name}`)
      );
      svg.appendChild(n);
      plotDiv.appendChild(svg);

      // initial dimensions based on chart title. Width may be extended later.
      svg.setAttribute('width', svg.getBBox().width + 10);
      svg.setAttribute('height', '500');

      return svg;
    }

    function plotSuite(ts_i, suite, svg_suite_state) {
      const svg = svg_suite_state.svg;
      const xinc = 15;
      // path line joins up all points
      var line = null;
      var xcoord = svg_suite_state.xcoord_next;
      var ycoord
      for (let i = 0; i < suite.testcases.length; i++) {
        const tc = suite.testcases[i];
        var rfill;
        var title = null;

        if (tc.failure) {
          title = tc.failure.message;
          rfill = "rgba(212, 22, 16)"; // red
          ycoord = 300;
        } else if (tc.error) {
          rfill = "rgba(228, 232, 19)"; // yellow
          ycoord = 300;
        } else if (tc.skipped) {
          title = tc.skipped.message;
          rfill = "rgba(29, 85, 176)"; // blue
          ycoord = 200;
        } else {
          title = tc.time ? `passed with time ${tc.time}` : null;
          rfill = "rgba(53, 176, 34)"; // green
          ycoord = 100;
        }

        if (tc.name in svg_suite_state.case_xcoords) {
          // reuse pre-existing testcase name on x-axis
          xcoord_next = xcoord;
          xcoord = svg_suite_state.case_xcoords[tc.name];
        } else {
          xcoord_next = xcoord + xinc;
          svg_suite_state.case_xcoords[tc.name] = xcoord;
          text_ycoord = 500;
          n = node('text', {x: 0, y: 0, 'font-size': '12', fill: 'white',
            transform: `translate(${xcoord + 10},${text_ycoord}) rotate(-90)`});
          n.appendChild(document.createTextNode(tc.name));
          svg.appendChild(n);
        }
        // stagger y-coords across suites plotted on the same axis, so points
        // aren't overlaid.
        ycoord += (15 * svg_suite_state.plot_i);

        var g = node('g', {});
        n = node('title', {});
        n.appendChild(
          document.createTextNode(`${tc.name}${title ? ': ' + title : ''}`));
        g.appendChild(n);
        n = node('a', { href: `#case.${ts_i}.${i}` });
        n.appendChild(
          node('rect', { x: xcoord, y: ycoord, width: 10, height: 10,
          fill: rfill, 'fill-opacity': '0.8', class: 'plot-rect' })
        );

        g.appendChild(n);
        svg.appendChild(g);

        if (!line) {
          // +5 for middle of rect
          line = `M ${xcoord + 5} ${ycoord + 5}`;
        } else {
          line += ` L ${xcoord + 5} ${ycoord + 5}`;
        }

        xcoord = xcoord_next;
      }

      // subsequent name-matched suites could reuse. Append new tests from where
      // we left off.
      svg_suite_state.xcoord_next = xcoord;

      if (line) {
        const color = line_colors[svg_suite_state.plot_i % line_colors.length];
        n = node('path',  // path connecting all points
          { fill: 'none', stroke: color, 'stroke-width': '3', d: line });
        svg_suite_state.line_sibling.after(n);
        svg_suite_state.line_sibling = n;
      }

      if (xcoord > svg.getAttribute('width')) {
        svg.setAttribute('width', xcoord);  // resize to fit bounds
      }
    }

    const plotDiv = document.getElementById("plotVector");
    plotDiv.replaceChildren();
    if (tss.length < 1) {
      return;
    }

    // plot matching testsuites on the same graph, reusing common x-axis points
    var svg_suite_state = {};
    tss[0].testsuite.forEach((suite, ts_i) => {
      if (suite.name in svg_suite_state) {
        svg_suite_state[suite.name].plot_i++;
      } else {
        const svg = plotInit(plotDiv, suite.name);
        svg_suite_state[suite.name] = {
          'svg': svg,
          xcoord_next: 5,
          case_xcoords: {},
          plot_i: 0,  // per-plot increment for this suite
          line_sibling: svg.lastChild // append line plots after bg and banner
        };
      }

      plotSuite(ts_i, suite, svg_suite_state[suite.name]);
    });

  }

  function parseText(text) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text.trim(),"text/xml");
    const resultAsJson = convertToJson(xmlDoc);
    document.querySelector('textarea.json').value = JSON.stringify(resultAsJson, null,2);
    document.querySelector('#result').innerHTML = tpl(resultAsJson);
    document.querySelector('textarea.html').value = tpl(resultAsJson, true).trim();
    const plotResuls = getSetting('PlotResult');
    if (plotResuls) {
      plotSvg(resultAsJson.testsuites);
    } else {
      plotSvg([]);
    }
  }

  // #case.$testsuite_id.$testcase_id URL opens and scrolls to details
  function scrollTestInView() {
    if (document.location.hash) {
      const hel = document.getElementById(document.location.hash.substring(1));
      if (hel) {
        for (el = hel; el; el = el.parentElement) {
          if (el.open === false) {
            el.setAttribute('open', true);
          }
        }
        hel.scrollIntoView();
      }
    }
  }

  function getSetting(name, defaultValue) {
    let setting = typeof defaultValue !== 'undefined' ? defaultValue : false;
    const settingName = `setting${name}`;
    // from dom
    const elm = document.getElementById(settingName);
    if (elm) {
      setting = elm.checked;
    }
    // overwrite with storage
    const strg = localStorage.getItem(settingName);
    if (strg) {
      setting = strg === 'true';
    }
    // update dom with storage
    if (elm && strg) {
      if (elm.checked !== setting) {
        elm.checked = setting;
      }
    }
    return setting;
  }

  function saveSettingInStorage(name, settingValue) {
    const settingName = `setting${name}`;
    const elm = document.getElementById(settingName);
    if (elm) {
      settingValue = elm.checked;
    }
    const strg = localStorage.setItem(settingName, settingValue ? settingValue : false);
  }

  function addCustomEventListener(selector, event, listener) {
    const elm = document.querySelector(selector);
    if (elm) {
      elm.addEventListener(event, listener);
    }
  }

  function init() {
    addCustomEventListener('textarea.xml', 'change', refresh);
    addCustomEventListener('#settingErrorIsFailure', 'change', refresh);
    addCustomEventListener('#settingPlotResult', 'change', refresh);
    addCustomEventListener('#file', 'change', processFile);
    getSetting('ErrorIsFailure', true);
    getSetting('PlotResult', false);

    const lsXml = localStorage.getItem('xml');
    if (lsXml) {
      document.querySelector('textarea.xml').value = lsXml;
      parseText(lsXml);
    }
    scrollTestInView();
    updateUrl = (id) => {
      window.location.hash = `#${id}`;
      return false;
    }
  
  }

  init();

})();
