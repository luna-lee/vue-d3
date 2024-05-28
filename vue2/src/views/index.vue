<template>
    <div>
        <!-- <forceVue /> -->
        <hierarchyVue />
    </div>
</template>
<script>
import forceVue from './force.vue';
import hierarchyVue from './hierarchy.vue';
export default {
    inheritAttrs: false,
    name: '',
    props: {},
    components: { forceVue, hierarchyVue },
    created() {},
    mounted() {},
    data() {
        return {};
    },
    watch: {},
    computed: {},
    methods: {}
};
</script>
<style lang="scss" scoped></style>
