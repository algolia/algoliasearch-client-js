/* eslint-disable no-console, import/no-commonjs, functional/immutable-data*/

const fs = require('fs-extra');
const path = require('path');
const execa = require('execa');

const targets = fs.readdirSync('packages').filter(f => fs.statSync(`packages/${f}`).isDirectory());

const bundledPackages = targets.map(target => `@algolia/${target}`);

run();

async function run() {
  if (process.env.CIRCLE_BUILD_NUM) {
    // eslint-disable-next-line functional/no-loop-statement
    for (const target of targets) {
      await build(target);
    }
  } else {
    await Promise.all(targets.map(target => build(target)));
  }
}

async function build(target) {
  await fs.remove(`packages/${target}/dist`);

  await execa(`rollup`, ['-c', '--environment', [`TARGET:${target}`].join(',')], {
    stdio: 'inherit',
  });

  await buildDefinition(target);

  if (target === 'algoliasearch') {
    await buildDefinition('algoliasearch', 'lite');
  }

  await fs.remove(path.resolve(`packages/${target}/dist/packages`));
}

async function buildDefinition(target, config = '') {
  const pkgDir = path.resolve(`packages/${target}`);
  const pkg = require(`${pkgDir}/package.json`);

  console.log();
  console.log(`Rolling up type definitions for ${target}...`);

  // build types
  const { Extractor, ExtractorConfig } = require('@microsoft/api-extractor');

  const extractorConfigPath = path.resolve(
    pkgDir,
    `api-extractor${config ? `-${config}` : ''}.json`
  );

  const extractorConfig = {
    ...ExtractorConfig.loadFileAndPrepare(extractorConfigPath),
    bundledPackages: target === 'algoliasearch' ? bundledPackages : [],
  };

  const result = Extractor.invoke(extractorConfig, {
    localBuild: true,
    showVerboseMessages: true,
  });

  if (result.succeeded) {
    if (pkg.buildOptions && pkg.buildOptions.dts) {
      const dtsPath = path.resolve(pkgDir, pkg.types);
      const existing = await fs.readFile(dtsPath, 'utf-8');
      const toAdd = await Promise.all(
        pkg.buildOptions.dts.map(file => {
          return fs.readFile(path.resolve(pkgDir, file), 'utf-8');
        })
      );
      await fs.writeFile(dtsPath, `${existing}\n${toAdd.join('\n')}`);
    }
    console.log(`API Extractor completed successfully.`);
  } else {
    console.error(
      `API Extractor completed with ${result.errorCount} errors` +
        ` and ${result.warningCount} warnings`
    );

    process.exitCode = 1;
  }
}
