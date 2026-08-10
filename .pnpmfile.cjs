function readPackage(pkg) {
  if (pkg.name === '@swc/core' || 
      pkg.name === 'bufferutil' || 
      pkg.name === 'utf-8-validate' || 
      pkg.name === 'blake-hash' ||
      pkg.name === 'esbuild') {
    pkg.pnpm = pkg.pnpm || {};
    pkg.pnpm.allowBuild = true;
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
