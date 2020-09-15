function getAverageTime(repos) {
  const totalMiliseconds = repos.reduce((acumulador, { node }) => {
    const miliseconds = new Date(node.createdAt).getTime();
    return acumulador + miliseconds;
  }, 0);

  const result = new Date(totalMiliseconds / repos.length);
  return result;
}

exports.getAverageTime = getAverageTime;
